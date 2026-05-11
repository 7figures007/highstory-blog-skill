import json
import os
from datetime import datetime, timedelta
import re

# This script is part of the highstory-blog-automation skill.
# It merges blog article metadata (briefs) with content bodies and updates articles.json.

lang_map = {
    'FR': 'fr', 'EN': 'en', 'ES': 'es', 'DE': 'de', 'CN': 'zh-CN', 'ZH': 'zh-CN',
    'IT': 'it', 'JP': 'ja', 'JA': 'ja', 'MA': 'ar-MA', 'DA': 'ar-MA', 'NL': 'nl', 
    'PL': 'pl', 'PT': 'pt', 'RO': 'ro', 'RU': 'ru', 'SV': 'sv', 'TR': 'tr', 'VN': 'vi'
}

def slugify(text):
    if not text: return "article"
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    return text.strip('-')

def format_content(body):
    if not body: return ''
    html = body
    
    # Headings
    html = re.sub(r'^### (.*$)', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*$)', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    
    # Bold / Italics
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'(?<!\*)\*([^\*\n]+)\*(?!\*)', r'<em>\1</em>', html)
    
    # Lists
    html = re.sub(r'^\* (.*$)', r'<li>\1</li>', html, flags=re.MULTILINE)
    html = re.sub(r'^\d+\. (.*$)', r'<li>\1</li>', html, flags=re.MULTILINE)
    
    lines = html.split('\n')
    in_list = False
    new_lines = []
    for line in lines:
        if line.startswith('<li>'):
            if not in_list:
                new_lines.append('<ul>')
                in_list = True
            new_lines.append(line)
        else:
            if in_list:
                new_lines.append('</ul>')
                in_list = False
            new_lines.append(line)
    if in_list: new_lines.append('</ul>')
    html = '\n'.join(new_lines)
    
    # Paragraphs
    blocks = [p.strip() for p in html.split('\n\n') if p.strip()]
    final_blocks = []
    for b in blocks:
        if b.startswith('<h') or b.startswith('<ul') or b.startswith('</div>') or b.startswith('<script'):
            final_blocks.append(b)
        else:
            final_blocks.append(f'<p>{b}</p>')
            
    return '\n\n'.join(final_blocks)

def extract_faq(js_in):
    try:
        data = json.loads(js_in) if isinstance(js_in, str) else js_in
        graph = data.get('@graph', [])
        items = graph if graph else [data]
        for item in items:
            if item.get('@type') == 'FAQPage':
                faqs = []
                for q in item.get('mainEntity', []):
                    faqs.append({
                        'q': q.get('name'),
                        'a': q.get('acceptedAnswer', {}).get('text')
                    })
                return faqs
    except:
        pass
    return []

def run_integration(downloads_dir, omnipresence_file, target_file, topics_per_week=2):
    # Load content bodies
    body_file = os.path.join(downloads_dir, 'blog articles all languages content body')
    if not os.path.exists(body_file):
        print(f"Error: {body_file} not found.")
        return

    with open(body_file, 'r', encoding='utf-8') as f:
        content_lines = f.read()
    
    content_map = {}
    blocks = content_lines.split('"id":')
    for block in blocks[1:]:
        try:
            id_val = block.split(',')[0].strip()
            lang_match = re.search(r'"lang":\s*"([^"]+)"', block)
            content_match = re.search(r'"content_body":\s*"(.*?)"\n\s*\}', block, flags=re.DOTALL)
            if lang_match and content_match:
                lang = lang_match.group(1)
                body = content_match.group(1).encode('utf-8').decode('unicode_escape')
                content_map[f"{lang}_{id_val}"] = body
        except:
            pass

    start_date = datetime.now()
    all_new_articles = []

    # Batch 1: 400 articles
    brief_files = [f for f in os.listdir(downloads_dir) if f.startswith('blog articles claude mcp') or f == 'all_articles.json']
    
    for file in brief_files:
        try:
            with open(os.path.join(downloads_dir, file), 'r', encoding='utf-8') as f:
                content = f.read().strip()
                content = re.sub(r'\]\s*\[', ',', content)
                brief_data = json.loads(content)
                
            for i, art in enumerate([a for a in brief_data if isinstance(a, dict) and 'id' in a]):
                topic_id = int(art.get('id', i + 1))
                # Cadence
                spacing_days = 7.0 / topics_per_week
                date = start_date + timedelta(days=(topic_id - 1) * spacing_days)
                
                body = content_map.get(f"{art.get('lang')}_{topic_id}", "")
                html = format_content(body)
                
                if art.get('faq'):
                    html += '\n\n<div class="callout callout-info" style="background: #EEF2FF; border: 1px solid #C7D2FE; padding: 1.25rem 1.5rem; margin: 2rem 0; border-radius: 8px;">\n'
                    html += '  <div class="callout-title" style="color: #3730A3; font-weight: bold; text-transform: uppercase; margin-bottom: 0.5rem; font-size: 14px;">FAQ</div>\n'
                    for fq in art['faq']:
                        html += f"  <p><strong>{fq.get('q')}</strong><br>{fq.get('a')}</p>\n"
                    html += '</div>'
                
                if art.get('json_ld'):
                    js_ld = art['json_ld']
                    if isinstance(js_ld, dict): js_ld = json.dumps(js_ld, indent=2, ensure_ascii=False)
                    html += f'\n<script type="application/ld+json">\n{js_ld}\n</script>'
                
                all_new_articles.append({
                    'slug': art.get('slug'),
                    'title': art.get('title'),
                    'date': date.strftime('%Y-%m-%d %H:%M:%S'),
                    'content': html,
                    'lang': lang_map.get(art.get('lang', ''), art.get('lang', '').lower()),
                    'featuredImageUrl': '/images/blog/highstory-calendar-unlimited.png'
                })
        except:
            pass

    # Batch 2: Omnipresence (Post NOW)
    if omnipresence_file and os.path.exists(omnipresence_file):
        try:
            with open(omnipresence_file, 'r', encoding='utf-8') as f:
                omni_content = f.read().strip()
                omni_content = re.sub(r'\]\s*\[', ',', omni_content)
                omni_data = json.loads(omni_content)
                
            for art in omni_data:
                lang = lang_map.get(art.get('lang', ''), art.get('lang', '').lower())
                date_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                html = format_content(art.get('content_body', ''))
                faqs = extract_faq(art.get('json_ld', '{}'))
                
                if faqs:
                    html += '\n\n<div class="callout callout-info" style="background: #EEF2FF; border: 1px solid #C7D2FE; padding: 1.25rem 1.5rem; margin: 2rem 0; border-radius: 8px;">\n'
                    html += '  <div class="callout-title" style="color: #3730A3; font-weight: bold; text-transform: uppercase; margin-bottom: 0.5rem; font-size: 14px;">FAQ</div>\n'
                    for fq in faqs:
                        html += f"  <p><strong>{fq['q']}</strong><br>{fq['a']}</p>\n"
                    html += '</div>'
                
                js_ld = art.get('json_ld', '{}')
                if isinstance(js_ld, dict): js_ld = json.dumps(js_ld, indent=2, ensure_ascii=False)
                html += f'\n<script type="application/ld+json">\n{js_ld}\n</script>'
                
                all_new_articles.append({
                    'slug': art.get('slug', slugify(art.get('title'))),
                    'title': art.get('title'),
                    'date': date_str,
                    'content': html,
                    'lang': lang,
                    'featuredImageUrl': '/images/blog/highstory-calendar-unlimited.png'
                })
        except:
            pass

    # Save to JSON
    if os.path.exists(target_file):
        with open(target_file, 'r', encoding='utf-8') as f:
            existing = json.load(f)
            # Find point where to append (optional logic here)
            final_list = existing + all_new_articles
    else:
        final_list = all_new_articles
        
    with open(target_file, 'w', encoding='utf-8') as f:
        json.dump(final_list, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully integrated {len(all_new_articles)} articles into {target_file}")

if __name__ == '__main__':
    import sys
    if len(sys.argv) < 4:
        print("Usage: python3 integrate_articles.py <downloads_dir> <omnipresence_file> <target_json_file>")
    else:
        run_integration(sys.argv[1], sys.argv[2], sys.argv[3])
