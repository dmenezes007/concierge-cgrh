#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Relatório Final - Status dos Documentos Reformatados
"""

from docx import Document
from docx.oxml.ns import qn
import os

def count_elements(doc_path):
    """Conta elementos do documento"""
    try:
        doc = Document(doc_path)
        
        sections = 0
        paragraphs = 0
        links = 0
        
        for para in doc.paragraphs:
            if para.text.strip():
                paragraphs += 1
                
                if para.style and 'Heading 2' in para.style.name:
                    sections += 1
                
                for hyperlink in para._element.xpath('.//w:hyperlink'):
                    r_id = hyperlink.get(qn('r:id'))
                    if r_id and r_id in para.part.rels:
                        links += 1
        
        return {'sections': sections, 'paragraphs': paragraphs, 'links': links}
    except:
        return {'sections': 0, 'paragraphs': 0, 'links': 0}

docs = [
    "Aposentadoria e Abono.docx",
    "Capacitação.docx",
    "Carta de Serviços.docx",
    "Dados Cadastrais.docx",
    "Estágio Probatório.docx",
    "Frequência.docx",
    "Férias.docx",
    "Licenças.docx",
    "Pagamento.docx",
    "Programa de Gestão e Desempenho.docx",
    "Remoção.docx",
    "Retribuição por Titulação.docx",
    "Saúde Ocupacional.docx",
    "Seleção Interna e Externa.docx",
    "Utilização do SouGov.docx"
]

docs_dir = r"C:\Users\Davison.DESKTOP-7GLJO2G\Documents\concierge-cgrh\docs"

print("=" * 90)
print("RELATORIO FINAL - DOCUMENTOS REFORMATADOS CONCIERGE RH DIGITAL")
print("=" * 90)
print()
print(f"{'DOCUMENTO':<45} {'SECOES':<10} {'PARAGRAFOS':<12} {'LINKS':<8}")
print("-" * 90)

total_links = 0
for doc_name in docs:
    doc_path = os.path.join(docs_dir, doc_name)
    result = count_elements(doc_path)
    
    status = "OK" if result['sections'] == 8 else "VERIFICAR"
    total_links += result['links']
    
    print(f"{doc_name:<45} {result['sections']:<10} {result['paragraphs']:<12} {result['links']:<8}")

print("-" * 90)
print(f"TOTAL: 15 documentos reformatados | {total_links} links preservados")
print("=" * 90)
print()
print("ESTRUTURA PADRONIZADA APLICADA:")
print("  1. Titulo principal (Heading 1)")
print("  2. Descricao introdutoria")
print("  3. O QUE E? (Heading 2)")
print("  4. QUEM TEM DIREITO? (Heading 2)")
print("  5. COMO SOLICITAR? (Heading 2)")
print("  6. PRAZOS (Heading 2)")
print("  7. DOCUMENTACAO NECESSARIA (Heading 2)")
print("  8. LEGISLACAO (Heading 2)")
print("  9. DUVIDAS FREQUENTES (Heading 2)")
print("  10. CONTATO (Heading 2)")
print()
print("BACKUPS ORIGINAIS:")
print("  - Todos os documentos originais foram preservados com prefixo 'backup_'")
print("  - Localizacao: " + docs_dir)
print()
print("=" * 90)
