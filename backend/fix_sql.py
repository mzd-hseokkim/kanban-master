import re

def fix_sql(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update NOTIFICATION table definition
    new_enum_def = "ENUM('CARD_ASSIGNMENT', 'CARD_MENTION', 'COMMENT_MENTION', 'SYSTEM', 'CARD_WATCH', 'DUE_DATE_IMMINENT')"

    content = content.replace(
        "\"TYPE\" ENUM('CARD_ASSIGNMENT', 'MENTION', 'SYSTEM') NOT NULL",
        f"\"TYPE\" {new_enum_def} NOT NULL"
    )

    lines = content.split('\n')
    new_lines = []

    for line in lines:
        if line.startswith("INSERT INTO O_23 VALUES"):
            # Find the last comma to locate the Type value
            last_comma_idx = line.rfind(',')
            end_paren_idx = line.rfind(');')

            if last_comma_idx != -1 and end_paren_idx != -1:
                current_val = line[last_comma_idx+1:end_paren_idx].strip()

                # Determine new type based on message content in the line
                new_type = "'SYSTEM'" # Default

                if "할당되었습니다" in line or "assigned" in line or "U&'\\ce74\\b4dc" in line:
                     new_type = "'CARD_ASSIGNMENT'"
                elif "카드 설명에서 회원님을 언급했습니다" in line or "mentioned you in card description" in line:
                     new_type = "'CARD_MENTION'"
                elif "댓글에서 회원님을 언급했습니다" in line or "mentioned you in a comment" in line:
                     new_type = "'COMMENT_MENTION'"
                elif "지켜보고 있습니다" in line or "watching" in line:
                     new_type = "'CARD_WATCH'"
                elif "마감 기한" in line or "Due date" in line:
                     new_type = "'DUE_DATE_IMMINENT'"

                # Replace the last value
                new_line = line[:last_comma_idx+1] + " " + new_type + ");"
                new_lines.append(new_line)
                print(f"Fixed line: {new_line}")
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))

if __name__ == "__main__":
    fix_sql('/Users/mz01-hseokkim/WORK/workspace/kanban-master/backend/data/kanban.h2.sql',
            '/Users/mz01-hseokkim/WORK/workspace/kanban-master/backend/data/kanban.h2.fixed.sql')
