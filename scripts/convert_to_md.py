import os
from markitdown import MarkItDown

md = MarkItDown()

# 忽略不需轉檔的資料夾
EXCLUDE_DIRS = {'.git', '.github', 'node_modules', 'dist', '__pycache__', 'venv', '.venv'}

def convert_files():
    for root, dirs, files in os.walk('.'):
        # 過濾不需要搜尋的目錄
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            if file.endswith('.py') or file.endswith('.json'):
                # 避免重複轉換已經生成的 md 檔案名稱
                if file.endswith('.config.json') or file == 'package-lock.json':
                    continue
                    
                file_path = os.path.join(root, file)
                output_md_path = f"{file_path}.md"
                
                try:
                    result = md.convert(file_path)
                    with open(output_md_path, 'w', encoding='utf-8') as f:
                        f.write(result.text_content)
                    print(f"成功轉檔: {file_path} -> {output_md_path}")
                except Exception as e:
                    print(f"轉檔失敗 {file_path}: {e}")

if __name__ == "__main__":
    convert_files()