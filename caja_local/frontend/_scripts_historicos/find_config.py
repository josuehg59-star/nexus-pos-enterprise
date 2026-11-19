import json
import re

log_path = r'C:\Users\JOSUE\.gemini\antigravity\brain\886dd74f-742d-42cb-86e0-1bfdb3036a96\.system_generated\logs\transcript_full.jsonl'

found_content = None

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
            # We are looking for the tool response for `cat src/pages/Config.tsx`
            # or `manage_task` output that has the full file content.
            # In transcript_full.jsonl, the output of `manage_task` for task-1740 will have it!
            if 'content' in obj and 'Task: 886dd74f-742d-42cb-86e0-1bfdb3036a96/task-1740' in obj['content']:
                # The output of manage_task is here! Wait, manage_task is truncated in the system message?
                # No, the system message had the full output!
                match = re.search(r'Output:\n(import .*?)(?=\nLog: )', obj['content'], re.DOTALL)
                if match:
                    found_content = match.group(1)
            
            # Or maybe the actual system message for task-1740 completion
            if 'content' in obj and 'Task id "886dd74f-742d-42cb-86e0-1bfdb3036a96/task-1740" finished' in obj['content']:
                match = re.search(r'Output:\n(import .*?)(?=\nLog: )', obj['content'], re.DOTALL)
                if match:
                    found_content = match.group(1)

        except Exception as e:
            pass

if found_content:
    with open('recovered_config.tsx', 'w', encoding='utf-8') as f:
        f.write(found_content)
    print("RECOVERED SUCCESSFULLY")
else:
    print("NOT FOUND")
