import os
from markitdown import MarkItDown

md = MarkItDown()

# еҝҪз•ҘдёҚйңҖиҪүжӘ”зҡ„иіҮж–ҷеӨҫ
EXCLUDE_DIRS = {'.git', '.github', 'node_modules', 'dist', '__pycache__', 'venv', '.venv'}

def convert_files():
    for root, dirs, files in os.walk('.'):
        # йҒҺжҝҫдёҚйңҖиҰҒжҗңе°Ӣзҡ„зӣ®йҢ„
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for file in files:
            if file.endswith('.py') or file.endswith('.json'):
                # йҒҝе…ҚйҮҚиӨҮиҪүжҸӣе·Із¶“з”ҹжҲҗзҡ„ md жӘ”жЎҲеҗҚзЁұ
                if file.endswith('.config.json') or file == 'package-lock.json':
                    continue

                file_path = os.path.join(root, file)
                output_md_path = f"{file_path}.md"

                try:
                    result = md.convert(file_path)
                    with open(output_md_path, 'w', encoding='utf-8') as f:
                        f.write(result.text_content)
                    print(f"жҲҗеҠҹиҪүжӘ”: {file_path} -> {output_md_path}")
                except Exception as e:
                    print(f"иҪүжӘ”еӨұж•— {file_path}: {e}")

if __name__ == "__main__":
    convert_files()