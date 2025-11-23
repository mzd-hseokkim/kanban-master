package com.kanban.excel;

public enum ExcelImportMode {
    MERGE, OVERWRITE;

    public static ExcelImportMode from(String value) {
        if (value == null) {
            return MERGE;
        }
        return switch (value.toLowerCase()) {
            case "overwrite" -> OVERWRITE;
            default -> MERGE;
        };
    }
}
