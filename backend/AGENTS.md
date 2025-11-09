# Kanban Backend - Java/Spring Boot Development Standards

## Technology Stack

- **Java**: 17 (LTS) - Use Modern Java features
- **Spring Boot**: 3.2.0
- **Build Tool**: Gradle (Kotlin DSL)
- **Database**: H2 (dev), PostgreSQL (prod)
- **ORM**: Spring Data JPA / Hibernate

## Modern Java Standards (Java 11+)

### Core Principles
- **Use Modern Java Features**: Leverage Java 11+ capabilities for cleaner, more maintainable code
- **Type Inference**: Use `var` for local variables when type is obvious
- **Immutability**: Prefer Records over traditional classes for DTOs
- **Functional Style**: Use Streams, Optionals, and functional interfaces
- **Modern Collections**: Use factory methods (List.of, Map.of, Set.of)

### 1. Type Inference with `var` (Java 10+)

**Use `var` when:**
- The type is obvious from the right-hand side
- It improves readability without sacrificing clarity
- Local variable scope only

```java
// ✅ Good - type is clear
var board = boardRepository.findById(id)
    .orElseThrow(() -> new ResourceNotFoundException("Board", "id", id));

var createdBoard = boardService.create(request);

var response = Map.of(
    "status", "UP",
    "timestamp", LocalDateTime.now()
);

// ❌ Avoid - type is not obvious
var result = process(); // What type is result?
var data = repository.find(); // Unclear return type
```

**Don't use `var` when:**
- Method parameters or return types
- Field declarations
- Type is not immediately clear
- Working with interfaces (prefer explicit type)

### 2. Records for DTOs (Java 16+)

**Use Records for:**
- Immutable data carriers
- DTOs that don't require complex logic
- Value objects

```java
// ✅ Modern - Using Record
public record BoardDto(
    Long id,
    String name,
    String description,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static BoardDto from(Board board) {
        return new BoardDto(
            board.getId(),
            board.getName(),
            board.getDescription(),
            board.getCreatedAt(),
            board.getUpdatedAt()
        );
    }
}

// ❌ Old Style - Lombok class (use for request DTOs with validation)
@Getter
@Builder
@AllArgsConstructor
public class BoardDto {
    private Long id;
    private String name;
    // ... more fields
}
```

**When NOT to use Records:**
- When you need Bean Validation annotations on fields
- When you need mutable state
- When you need inheritance
- When using JPA entities

### 3. Collection Factory Methods (Java 9+)

```java
// ✅ Modern
List<String> names = List.of("Alice", "Bob", "Charlie");
Set<Integer> numbers = Set.of(1, 2, 3);
Map<String, Object> response = Map.of(
    "status", "UP",
    "timestamp", LocalDateTime.now()
);

// ❌ Old Style
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");
Set<Integer> numbers = new HashSet<>(Arrays.asList(1, 2, 3));
Map<String, Object> response = new HashMap<>();
response.put("status", "UP");
response.put("timestamp", LocalDateTime.now());
```

**Note**: Factory methods create **immutable** collections. Use traditional constructors if you need mutability.

### 4. Stream API Best Practices

```java
// ✅ Good - concise and readable
return boardRepository.findAll().stream()
    .map(BoardDto::from)
    .toList(); // Java 16+ - no need for .collect(Collectors.toList())

// ✅ Good - filter and map
return boards.stream()
    .filter(board -> board.isActive())
    .map(Board::getName)
    .toList();

// ❌ Avoid - traditional loop when stream is more appropriate
List<BoardDto> result = new ArrayList<>();
for (Board board : boards) {
    result.add(BoardDto.from(board));
}
return result;
```

### 5. Optional Best Practices

```java
// ✅ Good - use orElseThrow
var board = boardRepository.findById(id)
    .orElseThrow(() -> new ResourceNotFoundException("Board", "id", id));

// ✅ Good - use ifPresent
boardRepository.findById(id)
    .ifPresent(board -> log.info("Found board: {}", board.getName()));

// ✅ Good - use map
return boardRepository.findById(id)
    .map(BoardDto::from);

// ❌ Avoid - using get() without checking
Board board = boardRepository.findById(id).get(); // Can throw NoSuchElementException

// ❌ Avoid - unnecessary isPresent check
Optional<Board> optional = boardRepository.findById(id);
if (optional.isPresent()) {
    return optional.get(); // Use orElseThrow instead
}
```

### 6. Text Blocks for Multi-line Strings (Java 15+)

```java
// ✅ Modern - Text blocks
String sql = """
    SELECT b.id, b.name, b.description
    FROM boards b
    WHERE b.created_at > ?
    ORDER BY b.created_at DESC
    """;

String json = """
    {
        "name": "%s",
        "description": "%s"
    }
    """.formatted(name, description);

// ❌ Old Style
String sql = "SELECT b.id, b.name, b.description\n" +
             "FROM boards b\n" +
             "WHERE b.created_at > ?\n" +
             "ORDER BY b.created_at DESC";
```

### 7. Switch Expressions (Java 14+)

```java
// ✅ Modern - switch expression
String status = switch (board.getStatus()) {
    case ACTIVE -> "Active";
    case ARCHIVED -> "Archived";
    case DELETED -> "Deleted";
    default -> "Unknown";
};

// ✅ Good - multiple values
int priority = switch (severity) {
    case LOW, MINOR -> 1;
    case MEDIUM, MODERATE -> 2;
    case HIGH, CRITICAL -> 3;
    default -> 0;
};

// ❌ Old Style
String status;
switch (board.getStatus()) {
    case ACTIVE:
        status = "Active";
        break;
    case ARCHIVED:
        status = "Archived";
        break;
    default:
        status = "Unknown";
}
```

### 8. Pattern Matching for instanceof (Java 16+)

```java
// ✅ Modern - pattern matching
if (obj instanceof Board board) {
    return BoardDto.from(board);
}

// ✅ Good - with logic
if (entity instanceof Board board && board.isActive()) {
    processBoard(board);
}

// ❌ Old Style
if (obj instanceof Board) {
    Board board = (Board) obj;
    return BoardDto.from(board);
}
```

### 9. Enhanced NPE Messages (Java 14+)

Java 14+ provides detailed NPE messages showing which variable was null.

```java
// When NPE occurs, Java 14+ shows:
// NullPointerException: Cannot invoke "Board.getName()" because "board" is null

// Instead of just:
// NullPointerException
```

### 10. Modern Exception Handling

```java
// ✅ Good - specific exceptions with context
throw new ResourceNotFoundException("Board", "id", id);

// ✅ Good - custom exception hierarchy
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, String field, Object value) {
        super("%s not found with %s: '%s'".formatted(resource, field, value));
    }
}

// ❌ Avoid - generic RuntimeException
throw new RuntimeException("Board not found with id: " + id);
```

### Modern Java Checklist

When writing new code, ensure:
- [ ] Use `var` for obvious local variable types
- [ ] Use Records for immutable DTOs
- [ ] Use Collection factory methods (List.of, Map.of, Set.of)
- [ ] Prefer Stream API over traditional loops
- [ ] Use Optional properly (orElseThrow, map, ifPresent)
- [ ] Use Text blocks for multi-line strings
- [ ] Use Switch expressions instead of statements
- [ ] Use Pattern matching for instanceof
- [ ] Use method references (Board::getName) when possible
- [ ] Use .toList() instead of .collect(Collectors.toList())

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/kanban/
│   │   │   ├── KanbanApplication.java
│   │   │   ├── config/           # Configuration classes
│   │   │   ├── controller/       # REST controllers
│   │   │   ├── dto/              # Data Transfer Objects
│   │   │   ├── entity/           # JPA entities
│   │   │   ├── exception/        # Custom exceptions
│   │   │   ├── repository/       # JPA repositories
│   │   │   └── service/          # Business logic
│   │   └── resources/
│   │       ├── application.yml
│   │       └── application-{profile}.yml
│   └── test/
│       └── java/com/kanban/
├── build.gradle.kts
└── settings.gradle.kts
```

## Coding Standards

### 1. Package Organization

#### Controller Layer
```java
@RestController
@RequestMapping("/api/v1/boards")
@RequiredArgsConstructor
public class BoardController {
    private final BoardService boardService;

    @GetMapping
    public ResponseEntity<List<BoardDto>> getAllBoards() {
        return ResponseEntity.ok(boardService.findAll());
    }
}
```

**Standards**:
- Use `@RestController` for REST APIs
- Apply `@RequestMapping` with API version prefix (`/api/v1/`)
- Use constructor injection with `@RequiredArgsConstructor` (Lombok)
- Return `ResponseEntity<T>` for explicit HTTP status control
- Keep controllers thin - delegate logic to services

#### Service Layer
```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardService {
    private final BoardRepository boardRepository;

    public List<BoardDto> findAll() {
        return boardRepository.findAll().stream()
            .map(BoardDto::from)
            .toList();
    }

    @Transactional
    public BoardDto create(CreateBoardRequest request) {
        Board board = Board.builder()
            .name(request.getName())
            .build();
        return BoardDto.from(boardRepository.save(board));
    }
}
```

**Standards**:
- Mark with `@Service`
- Use `@Transactional(readOnly = true)` at class level
- Override with `@Transactional` for write operations
- Business logic belongs here, not in controllers
- Convert entities to DTOs before returning

#### Repository Layer
```java
@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {
    List<Board> findByNameContaining(String keyword);

    @Query("SELECT b FROM Board b WHERE b.createdAt > :date")
    List<Board> findRecentBoards(@Param("date") LocalDateTime date);
}
```

**Standards**:
- Extend `JpaRepository<Entity, ID>`
- Use Spring Data JPA query methods
- Custom queries with `@Query` when needed
- Keep repository methods focused and atomic

#### Entity Layer
```java
@Entity
@Table(name = "boards")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Board extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Column> columns = new ArrayList<>();
}
```

**Standards**:
- Use Lombok annotations: `@Getter`, `@NoArgsConstructor`, `@Builder`
- Protected no-args constructor for JPA
- Extend `BaseEntity` for common fields (createdAt, updatedAt)
- Use appropriate cascade types
- Initialize collections to avoid NPE

#### DTO Layer
```java
@Getter
@Builder
@AllArgsConstructor
public class BoardDto {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;

    public static BoardDto from(Board board) {
        return BoardDto.builder()
            .id(board.getId())
            .name(board.getName())
            .description(board.getDescription())
            .createdAt(board.getCreatedAt())
            .build();
    }
}
```

**Standards**:
- Immutable with `@Getter` and final fields
- Static factory method `from(Entity)` for conversion
- Separate DTOs for request/response if needed
- No business logic in DTOs

### 2. Naming Conventions

#### Classes
- **Controllers**: `{Entity}Controller` (e.g., `BoardController`)
- **Services**: `{Entity}Service` (e.g., `BoardService`)
- **Repositories**: `{Entity}Repository` (e.g., `BoardRepository`)
- **Entities**: `{EntityName}` (e.g., `Board`, `Card`)
- **DTOs**: `{Entity}Dto`, `Create{Entity}Request`, `Update{Entity}Request`
- **Exceptions**: `{Entity}{Error}Exception` (e.g., `BoardNotFoundException`)

#### Methods
- **Repositories**: `findBy{Property}`, `existsBy{Property}`, `deleteBy{Property}`
- **Services**: `find{Entity}`, `create{Entity}`, `update{Entity}`, `delete{Entity}`
- **Controllers**: Use HTTP verb names (`getBoards`, `createBoard`, `updateBoard`, `deleteBoard`)

### 3. Error Handling

#### Global Exception Handler
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(EntityNotFoundException e) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException e) {
        List<String> errors = e.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(DefaultMessageSourceResolvable::getDefaultMessage)
            .toList();
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("Validation failed", errors));
    }
}
```

#### Custom Exceptions
```java
public class BoardNotFoundException extends RuntimeException {
    public BoardNotFoundException(Long id) {
        super("Board not found with id: " + id);
    }
}
```

### 4. Validation

```java
@Getter
@Builder
public class CreateBoardRequest {
    @NotBlank(message = "Board name is required")
    @Size(min = 1, max = 100, message = "Board name must be between 1 and 100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}
```

**Standards**:
- Use Bean Validation annotations
- Provide clear error messages
- Validate at controller level with `@Valid`
- Custom validators for complex rules

### 5. Configuration

#### Application Configuration
```yaml
spring:
  application:
    name: kanban-backend

  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}

  datasource:
    url: ${DATABASE_URL:jdbc:h2:mem:kanban}
    username: ${DATABASE_USERNAME:sa}
    password: ${DATABASE_PASSWORD:}

  jpa:
    hibernate:
      ddl-auto: ${DDL_AUTO:create-drop}
    show-sql: ${SHOW_SQL:true}

server:
  port: ${SERVER_PORT:8080}
```

**Standards**:
- Use environment variables with defaults
- Separate profiles for different environments
- Externalize sensitive configuration
- Use meaningful property names

## Configuration Classes

Spring Boot provides excellent auto-configuration, but custom configuration is needed for:
- CORS and web security
- HTTP clients
- API documentation
- JSON serialization
- Async processing

### Available Configurations

#### 1. WebMvcConfig - Web Layer Configuration
```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:3000")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowCredentials(true);
    }
}
```

**Purpose**:
- CORS configuration for frontend communication
- Custom message converters
- Interceptors and formatters
- Path matching configuration

**When to customize**:
- Adding new frontend origins
- Custom date/time formatters
- Request/response interceptors
- Custom argument resolvers

#### 2. RestClientConfig - HTTP Client Configuration
```java
@Configuration
public class RestClientConfig {
    @Bean
    public RestClient.Builder restClientBuilder() {
        var requestFactory = new JdkClientHttpRequestFactory();
        requestFactory.setReadTimeout(Duration.ofSeconds(30));
        return RestClient.builder()
            .requestFactory(requestFactory);
    }
}
```

**Purpose**:
- Configure RestClient (Spring 6.1+, replaces RestTemplate)
- Set timeouts and connection pools
- Add default headers
- Configure error handlers

**Usage**:
```java
@Service
@RequiredArgsConstructor
public class ExternalApiService {
    private final RestClient.Builder restClientBuilder;

    public String fetchData() {
        var restClient = restClientBuilder
            .baseUrl("https://api.example.com")
            .build();

        return restClient.get()
            .uri("/data")
            .retrieve()
            .body(String.class);
    }
}
```

#### 3. OpenApiConfig - API Documentation
```java
@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Kanban Board API")
                .version("1.0.0"));
    }
}
```

**Purpose**:
- Configure Swagger/OpenAPI documentation
- Set API metadata (title, description, version)
- Configure servers and security schemes

**Access**:
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

**Controller Annotations**:
```java
@RestController
@RequestMapping("/api/v1/boards")
@Tag(name = "Board", description = "Board management APIs")
public class BoardController {

    @Operation(summary = "Get all boards", description = "Returns list of all boards")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Success"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping
    public ResponseEntity<List<BoardDto>> getAllBoards() {
        // ...
    }
}
```

#### 4. JacksonConfig - JSON Serialization
```java
@Configuration
public class JacksonConfig {
    @Bean
    public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
        var objectMapper = builder.build();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return objectMapper;
    }
}
```

**Purpose**:
- Configure date/time formatting (ISO-8601)
- Handle null values
- Enable/disable pretty printing
- Custom serializers/deserializers

**Common Customizations**:
```java
// Include non-null values only
objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

// Case-insensitive deserialization
objectMapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);

// Custom date format
objectMapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd"));
```

#### 5. AsyncConfig - Asynchronous Processing
```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {
    @Override
    public Executor getAsyncExecutor() {
        var executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.initialize();
        return executor;
    }
}
```

**Purpose**:
- Enable `@Async` annotation
- Configure thread pool for async tasks
- Handle uncaught exceptions

**Usage**:
```java
@Service
public class EmailService {
    @Async
    public CompletableFuture<Void> sendEmail(String to, String subject) {
        // Long-running email sending task
        // Runs in separate thread
        return CompletableFuture.completedFuture(null);
    }
}
```

#### 6. JpaConfig - JPA Auditing
```java
@Configuration
@EnableJpaAuditing
public class JpaConfig {
    // Enables @CreatedDate and @LastModifiedDate
}
```

**Purpose**:
- Enable JPA auditing annotations
- Automatic createdAt/updatedAt tracking

### Configuration Best Practices

1. **Minimal Configuration**: Rely on Spring Boot auto-configuration when possible
2. **Environment-Specific**: Use profiles (dev, prod) for environment-specific settings
3. **Externalize Values**: Use `application.yml` for values, not hardcode in classes
4. **Document Purpose**: Add Javadoc explaining what and why
5. **Type Safety**: Use Java config over XML when possible

### Profile Management

**application.yml** - Base configuration
**application-dev.yml** - Development overrides
**application-prod.yml** - Production overrides

```yaml
# application.yml
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}
```

**Activate profile**:
```bash
# Command line
java -jar app.jar --spring.profiles.active=prod

# Environment variable
export SPRING_PROFILES_ACTIVE=prod
```

### Common Configuration Properties

#### Logging
```yaml
logging:
  level:
    root: INFO
    com.kanban: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
  file:
    name: logs/application.log
    max-size: 10MB
```

#### Database Connection Pool
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
```

#### JPA Optimizations
```yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 20
        order_inserts: true
        order_updates: true
```

### 6. Testing Standards

#### Unit Tests
```java
@ExtendWith(MockitoExtension.class)
class BoardServiceTest {
    @Mock
    private BoardRepository boardRepository;

    @InjectMocks
    private BoardService boardService;

    @Test
    @DisplayName("Should return all boards")
    void shouldReturnAllBoards() {
        // Given
        List<Board> boards = List.of(
            Board.builder().name("Board 1").build(),
            Board.builder().name("Board 2").build()
        );
        when(boardRepository.findAll()).thenReturn(boards);

        // When
        List<BoardDto> result = boardService.findAll();

        // Then
        assertThat(result).hasSize(2);
        verify(boardRepository).findAll();
    }
}
```

#### Integration Tests
```java
@SpringBootTest
@AutoConfigureMockMvc
class BoardControllerIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldCreateBoard() throws Exception {
        mockMvc.perform(post("/api/v1/boards")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Test Board\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Test Board"));
    }
}
```

**Standards**:
- Use JUnit 5 and AssertJ
- Follow Given-When-Then structure
- Mock external dependencies
- Use `@DisplayName` for readable test names
- Maintain ≥80% code coverage

## Best Practices

### 1. SOLID Principles
- **S**: Single Responsibility - Each class has one reason to change
- **O**: Open/Closed - Open for extension, closed for modification
- **L**: Liskov Substitution - Subtypes must be substitutable
- **I**: Interface Segregation - Many specific interfaces over one general
- **D**: Dependency Inversion - Depend on abstractions, not concretions

### 2. Spring Boot Best Practices
- Use constructor injection (avoid field injection)
- Leverage Spring Boot auto-configuration
- Use profiles for environment-specific configuration
- Implement proper transaction boundaries
- Use DTOs for API contracts

### 3. Database Best Practices
- Use connection pooling (HikariCP default)
- Implement proper indexing strategy
- Avoid N+1 query problems (use fetch joins)
- Use pagination for large result sets
- Implement soft delete for audit trails

### 4. Security Best Practices
- Validate all inputs
- Use parameterized queries (JPA does this)
- Implement proper authentication/authorization
- Secure sensitive endpoints
- Don't expose internal error details

### 5. Performance Best Practices
- Use caching where appropriate
- Optimize database queries
- Implement pagination
- Use async processing for long-running tasks
- Monitor application performance

## Code Review Checklist

- [ ] Code follows project structure and naming conventions
- [ ] Proper error handling implemented
- [ ] Input validation applied
- [ ] Unit tests written and passing
- [ ] No hardcoded values
- [ ] Logging at appropriate levels
- [ ] Documentation updated
- [ ] No code smells or violations
- [ ] Transaction boundaries correct
- [ ] Security considerations addressed
