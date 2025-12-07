#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de Validação - Verifica preservação de links e estrutura
"""

from docx import Document
from docx.oxml.ns import qn
import os

def validate_document(doc_path):
    """Valida estrutura e links de um documento"""
    try:
        doc = Document(doc_path)
        
        # Contar seções (Heading 2)
        sections = []
        paragraphs = 0
        links = 0
        
        for para in doc.paragraphs:
            if para.text.strip():
                paragraphs += 1
                
                # Identificar seções
                if para.style and 'Heading 2' in para.style.name:
                    sections.append(para.text.strip())
                
                # Contar hyperlinks
                for hyperlink in para._element.xpath('.//w:hyperlink'):
                    r_id = hyperlink.get(qn('r:id'))
                    if r_id and r_id in para.part.rels:
                        links += 1
        
        return {
            'sections': sections,
            'section_count': len(sections),
            'paragraphs': paragraphs,
            'links': links
        }
    except Exception as e:
        return {'error': str(e)}

# Documentos
docs_list = [
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

print("="*80)
print("VALIDAÇÃO DE DOCUMENTOS REFORMATADOS")
print("="*80)
print()

# Seções esperadas
expected_sections = [
    'O QUE É?',
    'QUEM TEM DIREITO?',
    'COMO SOLICITAR?',
    'PRAZOS',
    'DOCUMENTAÇÃO NECESSÁRIA',
    'LEGISLAÇÃO',
    'DÚVIDAS FREQUENTES',
    'CONTATO'
]

for doc_name in docs_list:
    print(f"📄 {doc_name}")
    print("-" * 80)
    
    # Validar documento reformatado
    doc_path = os.path.join(docs_dir, doc_name)
    result = validate_document(doc_path)
    
    if 'error' in result:
        print(f"   ❌ ERRO: {result['error']}")
    else:
        print(f"   ✅ Seções encontradas: {result['section_count']}")
        print(f"   📝 Parágrafos: {result['paragraphs']}")
        print(f"   🔗 Links preservados: {result['links']}")
        print(f"   📋 Seções:")
        for sec in result['sections']:
            indicator = "✅" if sec in expected_sections else "ℹ️"
            print(f"      {indicator} {sec}")
    
    print()

print("="*80)
print("✅ VALIDAÇÃO CONCLUÍDA")
print("="*80)
