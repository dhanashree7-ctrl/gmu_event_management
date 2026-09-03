import re
import json

with open('dump.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract INSERT INTO users (...) VALUES (...)
insert_pattern = re.compile(r'INSERT INTO `users` \([^)]+\) VALUES\s*(.*?;)', re.DOTALL)
inserts = insert_pattern.findall(content)

updates = []

def parse_values(val_str):
    records = []
    # Simple state machine to split by comma outside of quotes
    in_string = False
    escape = False
    current_val = []
    current_record = []
    
    i = 0
    while i < len(val_str):
        c = val_str[i]
        if escape:
            current_val.append(c)
            escape = False
        elif c == '\\\\':
            current_val.append(c)
            escape = True
        elif c == "'":
            current_val.append(c)
            in_string = not in_string
        elif c == ',' and not in_string:
            current_record.append(''.join(current_val).strip())
            current_val = []
        elif c == '(' and not in_string and not current_val:
            pass
        elif c == ')' and not in_string:
            current_record.append(''.join(current_val).strip())
            current_val = []
            records.append(current_record)
            current_record = []
            # Skip optional commas or spaces after )
            while i + 1 < len(val_str) and val_str[i+1] in ' ,\\r\\n':
                i += 1
        else:
            current_val.append(c)
        i += 1
    return records

for insert in inserts:
    records = parse_values(insert)
    for record in records:
        if len(record) >= 22:
            sl_no = record[0]
            device_token = record[21]
            if device_token != 'NULL' and device_token.strip("'"):
                updates.append(f"UPDATE users SET device_token = {device_token} WHERE SL_NO = {sl_no};")

with open('update_tokens.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(updates) + '\n')
print(f'Generated {len(updates)} update statements.')
