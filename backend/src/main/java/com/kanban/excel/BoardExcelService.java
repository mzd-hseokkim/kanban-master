package com.kanban.excel;

import static java.nio.file.StandardCopyOption.REPLACE_EXISTING;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;
import org.apache.poi.openxml4j.opc.OPCPackage;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.ss.util.WorkbookUtil;
import org.apache.poi.xssf.eventusermodel.ReadOnlySharedStringsTable;
import org.apache.poi.xssf.eventusermodel.XSSFReader;
import org.apache.poi.xssf.eventusermodel.XSSFSheetXMLHandler;
import org.apache.poi.xssf.eventusermodel.XSSFSheetXMLHandler.SheetContentsHandler;
import org.apache.poi.xssf.model.StylesTable;
import org.apache.poi.xssf.usermodel.XSSFComment;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;
import org.xml.sax.ContentHandler;
import org.xml.sax.InputSource;
import org.xml.sax.XMLReader;
import org.xml.sax.helpers.XMLReaderFactory;
import com.kanban.board.Board;
import com.kanban.board.BoardRepository;
import com.kanban.board.member.BoardMemberRole;
import com.kanban.board.member.BoardMemberRoleValidator;
import com.kanban.card.Card;
import com.kanban.card.CardRepository;
import com.kanban.checklist.ChecklistItem;
import com.kanban.checklist.ChecklistItemRepository;
import com.kanban.column.BoardColumn;
import com.kanban.column.ColumnRepository;
import com.kanban.excel.dto.ImportJobStartResponse;
import com.kanban.excel.dto.ImportJobStatusResponse;
import com.kanban.excel.model.ExcelRowData;
import com.kanban.label.CardLabel;
import com.kanban.label.CardLabelRepository;
import com.kanban.label.Label;
import com.kanban.label.LabelRepository;
import com.kanban.notification.event.BoardEvent;
import com.kanban.notification.service.RedisPublisher;
import com.kanban.user.User;
import com.kanban.user.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class BoardExcelService {

    private static final DateTimeFormatter ISO_INSTANT =
            DateTimeFormatter.ISO_INSTANT.withLocale(Locale.US);
    private static final int CHUNK_SIZE = 200;
    private static final String IMPORT_TOPIC_PATTERN = "/topic/boards/%d/import/%s";
    private static final List<String> HEADER_TITLES = List.of("Column Name", "Column Position",
            "Card Title", "Card Position", "Description", "Labels", "Assignee Email",
            "Due Date (UTC ISO8601)", "Checklist Items", "Checklist States", "Priority",
            "Parent Card Title");

    private final BoardRepository boardRepository;
    private final ColumnRepository columnRepository;
    private final CardRepository cardRepository;
    private final CardLabelRepository cardLabelRepository;
    private final ChecklistItemRepository checklistItemRepository;
    private final LabelRepository labelRepository;
    private final UserRepository userRepository;
    private final BoardMemberRoleValidator roleValidator;
    private final ImportJobManager importJobManager;
    private final SimpMessagingTemplate messagingTemplate;
    private final RedisPublisher redisPublisher;
    private final org.owasp.html.PolicyFactory htmlSanitizerPolicy;
    private final PlatformTransactionManager transactionManager;
    private TransactionTemplate transactionTemplate;

    @PostConstruct
    public void init() {
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.transactionTemplate.setPropagationBehavior(
                TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public byte[] writeTemplate() throws IOException {
        try (var outputStream = new java.io.ByteArrayOutputStream();
                org.apache.poi.xssf.streaming.SXSSFWorkbook workbook =
                        new org.apache.poi.xssf.streaming.SXSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Template");
            Row header = sheet.createRow(0);
            for (int i = 0; i < HEADER_TITLES.size(); i++) {
                header.createCell(i).setCellValue(HEADER_TITLES.get(i));
            }
            Row example = sheet.createRow(1);
            example.createCell(0).setCellValue("To Do");
            example.createCell(1).setCellValue(0);
            example.createCell(2).setCellValue("샘플 카드");
            example.createCell(3).setCellValue(0);
            example.createCell(4).setCellValue("이곳에 카드 설명을 작성하세요");
            example.createCell(5).setCellValue("버그;고우선순위");
            example.createCell(6).setCellValue("user@example.com");
            example.createCell(7).setCellValue(ISO_INSTANT
                    .format(LocalDate.now().atStartOfDay().toInstant(ZoneOffset.UTC)));
            example.createCell(8).setCellValue("체크리스트1;체크리스트2");
            example.createCell(9).setCellValue("true;false");

            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    @Transactional(readOnly = true)
    public byte[] exportBoard(Long workspaceId, Long boardId) throws IOException {
        Board board = boardRepository.findByIdAndWorkspaceId(boardId, workspaceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "보드를 찾을 수 없습니다"));
        roleValidator.validateRole(boardId, BoardMemberRole.VIEWER);

        List<BoardColumn> columns = columnRepository.findByBoardIdOrderByPosition(boardId);
        try (var outputStream = new java.io.ByteArrayOutputStream();
                org.apache.poi.xssf.streaming.SXSSFWorkbook workbook =
                        new org.apache.poi.xssf.streaming.SXSSFWorkbook(200)) {
            Sheet sheet = workbook.createSheet(
                    WorkbookUtil.createSafeSheetName(board.getName() + "-export"));
            Row header = sheet.createRow(0);
            for (int i = 0; i < HEADER_TITLES.size(); i++) {
                header.createCell(i).setCellValue(HEADER_TITLES.get(i));
            }

            AtomicInteger rowIndex = new AtomicInteger(1);
            for (BoardColumn column : columns) {
                List<Card> cards = cardRepository.findByColumnIdOrderByPosition(column.getId());
                Map<Long, List<String>> labelsByCard =
                        loadLabels(cards.stream().map(Card::getId).toList());
                Map<Long, List<ChecklistItem>> checklistByCard =
                        loadChecklists(cards.stream().map(Card::getId).toList());

                if (cards.isEmpty()) {
                    Row row = sheet.createRow(rowIndex.getAndIncrement());
                    row.createCell(0).setCellValue(column.getName());
                    row.createCell(1).setCellValue(column.getPosition());
                    continue;
                }

                for (Card card : cards) {
                    Row row = sheet.createRow(rowIndex.getAndIncrement());
                    row.createCell(0).setCellValue(column.getName());
                    row.createCell(1).setCellValue(column.getPosition());
                    row.createCell(2).setCellValue(card.getTitle());
                    row.createCell(3).setCellValue(card.getPosition());
                    row.createCell(4).setCellValue(
                            card.getDescription() == null ? "" : card.getDescription());
                    row.createCell(5).setCellValue(String.join(";",
                            labelsByCard.getOrDefault(card.getId(), List.of())));
                    row.createCell(6).setCellValue(
                            card.getAssignee() != null ? card.getAssignee().getEmail() : "");
                    if (card.getDueDate() != null) {
                        row.createCell(7).setCellValue(ISO_INSTANT.format(card.getDueDate()
                                .atStartOfDay().toInstant(ZoneOffset.UTC)));
                    }
                    List<ChecklistItem> items =
                            checklistByCard.getOrDefault(card.getId(), Collections.emptyList());
                    row.createCell(8).setCellValue(items.stream().map(ChecklistItem::getContent)
                            .toList().stream().reduce((a, b) -> a + ";" + b).orElse(""));
                    row.createCell(9).setCellValue(items.stream()
                            .map(item -> Boolean.TRUE.equals(item.getIsChecked()) ? "true" : "false")
                            .toList().stream().reduce((a, b) -> a + ";" + b).orElse(""));
                    row.createCell(10).setCellValue(card.getPriority() == null ? "" : card.getPriority());
                    if (card.getParentCard() != null) {
                        row.createCell(11).setCellValue(card.getParentCard().getTitle());
                    }
                }
            }

            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    public ImportJobStartResponse startImport(Long workspaceId, Long boardId, MultipartFile file,
            String modeValue, Long userId) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "업로드된 파일이 없습니다");
        }
        if (file.getSize() > 25L * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "파일 크기는 25MB 이하여야 합니다");
        }
        Board board = boardRepository.findByIdAndWorkspaceId(boardId, workspaceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "보드를 찾을 수 없습니다"));
        roleValidator.validateRole(boardId, BoardMemberRole.EDITOR);

        ExcelImportMode mode = ExcelImportMode.from(modeValue);
        Path tempFile = saveTempFile(file);
        ImportJobStatus status = importJobManager.createJob(workspaceId, boardId, mode,
                file.getOriginalFilename());
        processImportAsync(status.getJobId(), board, tempFile, mode, userId);

        return ImportJobStartResponse.builder().jobId(status.getJobId()).mode(mode)
                .state(status.getState()).filename(status.getFilename()).build();
    }

    public Optional<ImportJobStatusResponse> getStatus(String jobId) {
        return importJobManager.getJob(jobId).map(this::toResponse);
    }

    @Async
    public void processImportAsync(String jobId, Board board, Path tempFile, ExcelImportMode mode,
            Long userId) {
        try {
            int totalRows = countRows(tempFile);
            ImportJobStatus status = importJobManager.markInProgress(jobId, totalRows);
            publishStatus(status);

            if (mode == ExcelImportMode.OVERWRITE) {
                archiveExistingCards(board.getId(), userId);
            }

            Map<String, Label> labelCache =
                    loadLabelCache(board.getId()); // name(lower) -> Label
            Map<String, BoardColumn> columnCache = new HashMap<>();
            Set<Long> archivedColumns = new HashSet<>();

            AtomicInteger processed = new AtomicInteger();
            AtomicInteger success = new AtomicInteger();
            List<ExcelRowData> buffer = new ArrayList<>();
            parseSheet(tempFile, row -> {
                buffer.add(row);
                if (buffer.size() >= CHUNK_SIZE) {
                    int chunkSuccess = persistChunk(board, buffer, mode, labelCache, columnCache,
                            archivedColumns, userId, jobId);
                    success.addAndGet(chunkSuccess);
                    processed.addAndGet(buffer.size());
                    buffer.clear();
                    importJobManager.updateProgress(jobId, processed.get(), success.get(),
                            processed.get() - success.get());
                    publishStatus(importJobManager.getJob(jobId).orElse(null));
                }
            });

            if (!buffer.isEmpty()) {
                int chunkSuccess = persistChunk(board, buffer, mode, labelCache, columnCache,
                        archivedColumns, userId, jobId);
                success.addAndGet(chunkSuccess);
                processed.addAndGet(buffer.size());
                importJobManager.updateProgress(jobId, processed.get(), success.get(),
                        processed.get() - success.get());
            }

            importJobManager.markCompleted(jobId, "가져오기가 완료되었습니다");
            publishStatus(importJobManager.getJob(jobId).orElse(null));

            redisPublisher.publish(new BoardEvent("IMPORT_COMPLETED", board.getId(),
                    Map.of("jobId", jobId, "success", success.get(), "failure",
                            processed.get() - success.get()),
                    userId, System.currentTimeMillis()));
        } catch (Exception e) {
            log.error("Excel import failed for job {}", jobId, e);
            importJobManager.markFailed(jobId, "가져오기 중 오류가 발생했습니다: " + e.getMessage());
            publishStatus(importJobManager.getJob(jobId).orElse(null));
        } finally {
            try {
                Files.deleteIfExists(tempFile);
            } catch (IOException ignore) {
                log.warn("Failed to delete temp file {}", tempFile);
            }
        }
    }

    private int persistChunk(Board board, List<ExcelRowData> rows, ExcelImportMode mode,
            Map<String, Label> labelCache, Map<String, BoardColumn> columnCache,
            Set<Long> archivedColumns, Long userId, String jobId) {
        return transactionTemplate.execute(status -> {
            AtomicInteger chunkSuccess = new AtomicInteger();
            for (int i = 0; i < rows.size(); i++) {
                ExcelRowData row = rows.get(i);
                int rowNumber = row.getRowIndex();
                if (!StringUtils.hasText(row.getColumnName())) {
                    importJobManager.appendError(jobId,
                            new ImportRowError(rowNumber, "필수 값(컬럼명)이 비어 있습니다"));
                    continue;
                }

                boolean hasCardPayload = StringUtils.hasText(row.getCardTitle())
                        || StringUtils.hasText(row.getDescription())
                        || (row.getLabels() != null && !row.getLabels().isEmpty())
                        || StringUtils.hasText(row.getAssigneeEmail()) || row.getDueDate() != null
                        || (row.getChecklistItems() != null && !row.getChecklistItems().isEmpty());

                // 컬럼만 생성하는 행(카드 정보 없음)
                if (!hasCardPayload) {
                    resolveColumn(board.getId(), row, columnCache);
                    chunkSuccess.incrementAndGet();
                    continue;
                }

                if (!StringUtils.hasText(row.getCardTitle())) {
                    importJobManager.appendError(jobId,
                            new ImportRowError(rowNumber, "카드 제목이 비어 있습니다"));
                    continue;
                }

                BoardColumn column = resolveColumn(board.getId(), row, columnCache);
                if (mode == ExcelImportMode.OVERWRITE && !archivedColumns.contains(column.getId())) {
                    archiveColumnCards(column.getId(), userId);
                    archivedColumns.add(column.getId());
                }

                Optional<Card> existingCard = cardRepository.findByColumnIdAndTitleIgnoreCase(
                        column.getId(), row.getCardTitle());

                Card card = existingCard.orElseGet(() -> Card.builder().column(column).position(
                        row.getCardPosition() != null ? row.getCardPosition()
                                : cardRepository.countByColumnId(column.getId())).build());

                card.setTitle(row.getCardTitle());
                card.setDescription(sanitizeDescription(row.getDescription()));
                if (row.getCardPosition() != null) {
                    card.setPosition(row.getCardPosition());
                } else if (card.getPosition() == null) {
                    card.setPosition(cardRepository.countByColumnId(column.getId()));
                }
                card.setDueDate(row.getDueDate());
                if (StringUtils.hasText(row.getPriority())) {
                    card.setPriority(row.getPriority());
                }
                card.setIsArchived(false);
                card.setArchivedAt(null);

                if (StringUtils.hasText(row.getAssigneeEmail())) {
                    User assignee = userRepository.findByEmail(row.getAssigneeEmail())
                            .orElse(null);
                    if (assignee == null) {
                        importJobManager.appendError(jobId, new ImportRowError(rowNumber,
                                "담당자 이메일을 찾을 수 없습니다: " + row.getAssigneeEmail()));
                        continue;
                    }
                    card.setAssignee(assignee);
                } else {
                    card.setAssignee(null);
                }

                List<String> labelNames =
                        row.getLabels() != null ? row.getLabels() : List.of();
                List<Label> labels = labelNames.isEmpty() ? List.of()
                        : resolveLabels(labelCache, board, labelNames);

                Card saved = cardRepository.save(card);

                // 부모 카드 연결 (동일 컬럼 → 동일 보드 순)
                if (StringUtils.hasText(row.getParentCardTitle())) {
                    String parentTitle = row.getParentCardTitle();
                    Optional<Card> parentInColumn = cardRepository.findByColumnIdAndTitleIgnoreCase(
                            column.getId(), parentTitle);
                    if (parentInColumn.isPresent()) {
                        saved.setParentCard(parentInColumn.get());
                    } else {
                        List<Card> boardMatches = cardRepository.findByBoardIdAndTitleIgnoreCase(
                                board.getId(), parentTitle);
                        if (!boardMatches.isEmpty()) {
                            saved.setParentCard(boardMatches.get(0));
                        }
                    }
                }

                // 라벨 매핑
                cardLabelRepository.deleteByCardId(saved.getId());
                if (!labels.isEmpty()) {
                    List<CardLabel> cardLabels =
                            labels.stream().map(label -> CardLabel.of(saved, label)).toList();
                    cardLabelRepository.saveAll(cardLabels);
                }

                // 체크리스트
                checklistItemRepository.deleteByCardId(saved.getId());
                List<Boolean> checklistStates = row.getChecklistStates() != null
                        ? row.getChecklistStates()
                        : List.of();
                if (row.getChecklistItems() != null && !row.getChecklistItems().isEmpty()) {
                    List<ChecklistItem> items = new ArrayList<>();
                    for (int idx = 0; idx < row.getChecklistItems().size(); idx++) {
                        String content = row.getChecklistItems().get(idx);
                        boolean checked = idx < checklistStates.size()
                                && Boolean.TRUE.equals(checklistStates.get(idx));
                        items.add(ChecklistItem.builder().card(saved).content(content)
                                .position(idx).isChecked(checked).build());
                    }
                    checklistItemRepository.saveAll(items);
                }

                chunkSuccess.incrementAndGet();
            }
            return chunkSuccess.get();
        });
    }

    private void archiveExistingCards(Long boardId, Long userId) {
        List<BoardColumn> columns = columnRepository.findByBoardIdOrderByPosition(boardId);
        for (BoardColumn column : columns) {
            archiveColumnCards(column.getId(), userId);
        }
    }

    private void archiveColumnCards(Long columnId, Long userId) {
        List<Card> cards = cardRepository.findByColumnIdOrderByPosition(columnId);
        for (Card card : cards) {
            if (!Boolean.TRUE.equals(card.getIsArchived())) {
                card.setIsArchived(true);
                card.setArchivedAt(java.time.LocalDateTime.now());
                cardRepository.save(card);
                redisPublisher.publish(new BoardEvent(BoardEvent.EventType.CARD_UPDATED.name(),
                        card.getColumn().getBoard().getId(),
                        Map.of("cardId", card.getId(), "isArchived", true), userId,
                        System.currentTimeMillis()));
            }
        }
    }

    private BoardColumn resolveColumn(Long boardId, ExcelRowData row,
            Map<String, BoardColumn> cache) {
        String key = row.getColumnName().toLowerCase(Locale.ROOT).trim();
        if (cache.containsKey(key)) {
            BoardColumn existing = cache.get(key);
            if (row.getColumnPosition() != null && !row.getColumnPosition().equals(existing.getPosition())) {
                existing.setPosition(row.getColumnPosition());
                columnRepository.save(existing);
            }
            return existing;
        }

        Optional<BoardColumn> existing = columnRepository.findByBoardIdAndNameIgnoreCase(boardId,
                row.getColumnName());
        BoardColumn column = existing.orElseGet(() -> {
            int nextPosition = columnRepository.countByBoardId(boardId);
            BoardColumn created =
                    BoardColumn.builder().board(boardRepository.findById(boardId).orElseThrow())
                            .name(row.getColumnName()).position(
                                    row.getColumnPosition() != null ? row.getColumnPosition()
                                            : nextPosition)
                            .build();
            return columnRepository.save(created);
        });

        cache.put(key, column);
        return column;
    }

    private Map<String, Label> loadLabelCache(Long boardId) {
        return labelRepository.findByBoardIdOrderByDisplayOrder(boardId).stream()
                .collect(HashMap::new,
                        (map, label) -> map.put(label.getName().toLowerCase(Locale.ROOT), label),
                        Map::putAll);
    }

    private List<Label> resolveLabels(Map<String, Label> cache, Board board,
            List<String> names) {
        List<String> lowerNames = names.stream().map(name -> name.toLowerCase(Locale.ROOT).trim())
                .filter(StringUtils::hasText).toList();
        List<Label> labels = new ArrayList<>();
        for (String name : lowerNames) {
            Label label = cache.get(name);
            if (label != null) {
                labels.add(label);
            }
        }
        if (labels.size() != lowerNames.size()) {
            List<String> missing = new ArrayList<>(lowerNames);
            missing.removeAll(labels.stream().map(l -> l.getName().toLowerCase(Locale.ROOT))
                    .toList());
            if (!missing.isEmpty()) {
                List<Label> fetched =
                        labelRepository.findByBoardIdAndNameInIgnoreCase(board.getId(), missing);
                fetched.forEach(l -> cache.put(l.getName().toLowerCase(Locale.ROOT), l));
                labels.addAll(fetched);

                // 남은 것이 있으면 생성
                List<String> stillMissing = new ArrayList<>(missing);
                stillMissing.removeAll(fetched.stream()
                        .map(l -> l.getName().toLowerCase(Locale.ROOT)).toList());
                if (!stillMissing.isEmpty()) {
                    Integer maxOrderObj = labelRepository.findMaxDisplayOrderByBoardId(board.getId());
                    int startOrder = (maxOrderObj == null || maxOrderObj < 0) ? 0 : maxOrderObj + 1;
                    for (int idx = 0; idx < stillMissing.size(); idx++) {
                        String rawName = stillMissing.get(idx);
                        Label created = Label.builder().board(board)
                                .name(rawName)
                                .colorToken("gray")
                                .description(null)
                                .displayOrder(startOrder + idx)
                                .build();
                        Label saved = labelRepository.save(created);
                        cache.put(saved.getName().toLowerCase(Locale.ROOT), saved);
                        labels.add(saved);
                    }
                }
            }
        }
        return labels;
    }

    private Map<Long, List<String>> loadLabels(List<Long> cardIds) {
        if (cardIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, List<String>> result = new HashMap<>();
        cardLabelRepository.findByCardIdIn(cardIds).forEach(cardLabel -> {
            result.computeIfAbsent(cardLabel.getCard().getId(), id -> new ArrayList<>())
                    .add(cardLabel.getLabel().getName());
        });
        result.values().forEach(list -> list.sort(Comparator.naturalOrder()));
        return result;
    }

    private Map<Long, List<ChecklistItem>> loadChecklists(List<Long> cardIds) {
        if (cardIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, List<ChecklistItem>> result = new HashMap<>();
        checklistItemRepository.findByCardIdInOrderByPosition(cardIds).forEach(item -> {
            result.computeIfAbsent(item.getCard().getId(), id -> new ArrayList<>()).add(item);
        });
        return result;
    }

    private Path saveTempFile(MultipartFile file) {
        try {
            Path uploadDir = Paths.get("uploads", "imports");
            Files.createDirectories(uploadDir);
            Path tempFile = uploadDir.resolve(
                    java.util.UUID.randomUUID() + "-" + file.getOriginalFilename());
            Files.copy(file.getInputStream(), tempFile, REPLACE_EXISTING);
            return tempFile;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "업로드 파일을 저장하지 못했습니다");
        }
    }

    private int countRows(Path file) throws Exception {
        AtomicInteger count = new AtomicInteger();
        parseSheet(file, row -> count.incrementAndGet());
        return count.get();
    }

    private void parseSheet(Path file, Consumer<ExcelRowData> consumer) throws Exception {
        try (OPCPackage pkg = OPCPackage.open(file.toFile())) {
            ReadOnlySharedStringsTable strings = new ReadOnlySharedStringsTable(pkg);
            XSSFReader xssfReader = new XSSFReader(pkg);
            StylesTable styles = xssfReader.getStylesTable();
            XSSFReader.SheetIterator iter =
                    (XSSFReader.SheetIterator) xssfReader.getSheetsData();
            if (!iter.hasNext()) {
                return;
            }
            try (InputStream sheetStream = iter.next()) {
                ContentHandler handler =
                        new XSSFSheetXMLHandler(styles, null, strings,
                                new ImportSheetHandler(consumer), new org.apache.poi.ss.usermodel.DataFormatter(),
                                false);
                XMLReader sheetParser = XMLReaderFactory.createXMLReader();
                sheetParser.setContentHandler(handler);
                sheetParser.parse(new InputSource(sheetStream));
            }
        }
    }

    private String sanitizeDescription(String description) {
        if (!StringUtils.hasText(description)) {
            return "";
        }
        return htmlSanitizerPolicy.sanitize(description);
    }

    private void publishStatus(ImportJobStatus status) {
        if (status == null) {
            return;
        }
        ImportJobStatusResponse response = toResponse(status);
        messagingTemplate.convertAndSend(
                IMPORT_TOPIC_PATTERN.formatted(status.getBoardId(), status.getJobId()), response);
    }

    private ImportJobStatusResponse toResponse(ImportJobStatus status) {
        return ImportJobStatusResponse.builder().jobId(status.getJobId())
                .workspaceId(status.getWorkspaceId()).boardId(status.getBoardId())
                .mode(status.getMode()).state(status.getState()).totalRows(status.getTotalRows())
                .processedRows(status.getProcessedRows()).successCount(status.getSuccessCount())
                .failureCount(status.getFailureCount()).errors(status.getErrors())
                .progressPercent(status.progressPercent()).message(status.getMessage())
                .startedAt(status.getStartedAt()).finishedAt(status.getFinishedAt()).build();
    }

    private class ImportSheetHandler implements SheetContentsHandler {
        private final Consumer<ExcelRowData> consumer;
        private final Map<Integer, String> cellValues = new HashMap<>();
        private final Map<Integer, String> headers = new HashMap<>();
        private int currentRow = -1;

        ImportSheetHandler(Consumer<ExcelRowData> consumer) {
            this.consumer = consumer;
        }

        @Override
        public void startRow(int rowNum) {
            cellValues.clear();
            currentRow = rowNum;
        }

        @Override
        public void endRow(int rowNum) {
            if (rowNum == 0) {
                cellValues.forEach((idx, value) -> headers.put(idx, value));
                return;
            }
            ExcelRowData rowData = mapRow(cellValues);
            consumer.accept(rowData);
        }

        @Override
        public void cell(String cellReference, String formattedValue, XSSFComment comment) {
            int columnIndex = new CellReference(cellReference).getCol();
            cellValues.put(columnIndex, formattedValue);
        }

        @Override
        public void headerFooter(String text, boolean isHeader, String tagName) {
            // no-op
        }

        private ExcelRowData mapRow(Map<Integer, String> values) {
            Map<String, String> normalized = new HashMap<>();
            values.forEach((idx, val) -> {
                String header = headers.get(idx);
                if (header != null) {
                    normalized.put(header.trim().toLowerCase(Locale.ROOT), val);
                }
            });

            return ExcelRowData.builder()
                    .rowIndex(currentRow + 1)
                    .columnName(normalized.getOrDefault("column name", "").trim())
                    .columnPosition(parseInteger(normalized.get("column position")))
                    .cardTitle(normalized.getOrDefault("card title", "").trim())
                    .cardPosition(parseInteger(normalized.get("card position")))
                    .description(normalized.getOrDefault("description", ""))
                    .labels(split(normalized.get("labels")))
                    .assigneeEmail(normalized.getOrDefault("assignee email", "").trim())
                    .dueDate(parseDate(normalized.get("due date (utc iso8601)")))
                    .checklistItems(split(normalized.get("checklist items")))
                    .checklistStates(splitBooleans(normalized.get("checklist states")))
                    .priority(normalized.getOrDefault("priority", "").trim())
                    .parentCardTitle(normalized.getOrDefault("parent card title", "").trim())
                    .build();
        }

        private Integer parseInteger(String value) {
            if (!StringUtils.hasText(value)) {
                return null;
            }
            try {
                return Integer.parseInt(value.trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }

        private LocalDate parseDate(String value) {
            if (!StringUtils.hasText(value)) {
                return null;
            }
            try {
                return LocalDate.ofInstant(java.time.Instant.parse(value.trim()), ZoneOffset.UTC);
            } catch (DateTimeParseException ex) {
                try {
                    return LocalDate.parse(value.trim());
                } catch (DateTimeParseException ignore) {
                    return null;
                }
            }
        }

        private List<String> split(String value) {
            if (!StringUtils.hasText(value)) {
                return List.of();
            }
            String[] parts = value.split(";");
            List<String> result = new ArrayList<>();
            for (String part : parts) {
                if (StringUtils.hasText(part)) {
                    result.add(part.trim());
                }
            }
            return result;
        }

        private List<Boolean> splitBooleans(String value) {
            if (!StringUtils.hasText(value)) {
                return List.of();
            }
            String[] parts = value.split(";");
            List<Boolean> result = new ArrayList<>();
            for (String part : parts) {
                result.add(Boolean.parseBoolean(part.trim()));
            }
            return result;
        }
    }
}
