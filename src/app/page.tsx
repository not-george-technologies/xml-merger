'use client';

import { useState, useRef } from 'react';

interface FileStats {
  totalRecords: number;
  commonRecords: number;
  fileName: string;
}

interface XmlInput {
  type: 'url' | 'file';
  value: string;
  file?: File;
}

export default function Home() {
  const [xmlInputs, setXmlInputs] = useState<XmlInput[]>([
    { type: 'url', value: '' },
    { type: 'url', value: '' }
  ]);
  const [fileName, setFileName] = useState('merged-xml');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<FileStats[]>([]);
  const [mergedXml, setMergedXml] = useState<string>('');
  const resultRef = useRef<HTMLDivElement>(null);

  const addXmlInput = () => {
    setXmlInputs([...xmlInputs, { type: 'url', value: '' }]);
  };

  const removeXmlInput = (index: number) => {
    if (xmlInputs.length > 2) {
      setXmlInputs(xmlInputs.filter((_, i) => i !== index));
    }
  };

  const updateXmlInput = (index: number, updates: Partial<XmlInput>) => {
    const newInputs = [...xmlInputs];
    newInputs[index] = { ...newInputs[index], ...updates };
    setXmlInputs(newInputs);
  };

  const handleFileUpload = (index: number, file: File | null) => {
    if (file) {
      updateXmlInput(index, { type: 'file', file, value: file.name });
    }
  };

  const formatXml = (xmlString: string): string => {
    const PADDING = '  '; // 2 spaces for indentation
    const reg = /(>)(<)(\/*)/g;
    let formatted = xmlString.replace(reg, '$1\n$2$3');
    
    let pad = 0;
    return formatted.split('\n').map((line) => {
      let indent = 0;
      if (line.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (line.match(/^<\/\w/) && pad > 0) {
        pad -= 1;
      } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }
      
      const padding = PADDING.repeat(pad);
      pad += indent;
      return padding + line;
    }).join('\n');
  };

  const fetchXmlData = async (xmlInput: XmlInput): Promise<Document> => {
    let xmlText: string;
    
    if (xmlInput.type === 'url') {
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(xmlInput.value)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch XML from ${xmlInput.value}`);
      }
      xmlText = await response.text();
    } else if (xmlInput.type === 'file' && xmlInput.file) {
      xmlText = await xmlInput.file.text();
    } else {
      throw new Error('Invalid XML input configuration');
    }
    
    const parser = new DOMParser();
    return parser.parseFromString(xmlText, 'text/xml');
  };

  const extractItems = (xmlDoc: Document): Element[] => {
    debugger;
    return Array.from(xmlDoc.getElementsByTagName('item'));
  };

  const getGId = (item: Element): string | null => {
    // Try different approaches to find g:id
    let gIdElement = item.getElementsByTagName('g:id')[0];
    if (!gIdElement) {
      // Fallback: look for any element with local name 'id' in the Google namespace
      const elements = item.getElementsByTagName('*');
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if ((el.localName === 'id' || el.tagName === 'g:id') && 
            (el.namespaceURI === 'http://base.google.com/ns/1.0' || el.tagName.startsWith('g:'))) {
          gIdElement = el;
          break;
        }
      }
    }
    return gIdElement?.textContent?.trim() || null;
  };

  const mergeXmlFiles = async () => {
    setIsProcessing(true);
    setStats([]);
    setMergedXml('');

    try {
      const validInputs = xmlInputs.filter(input => 
        (input.type === 'url' && input.value.trim() !== '') || 
        (input.type === 'file' && input.file)
      );
      
      if (validInputs.length < 2) {
        alert('Please provide at least 2 XML sources (URLs or files)');
        return;
      }

      const xmlDocs = await Promise.all(validInputs.map(fetchXmlData));
      const allItems = xmlDocs.map(extractItems);
      
      const itemsByGId = new Map<string, Element[]>();
      const fileStats: FileStats[] = [];

      allItems.forEach((items, fileIndex) => {
        let validItemsCount = 0;
        
        items.forEach(item => {
          const gId = getGId(item);
          if (gId) {
            validItemsCount++;
            if (!itemsByGId.has(gId)) {
              itemsByGId.set(gId, []);
            }
            itemsByGId.get(gId)!.push(item);
          }
        });

        const inputName = validInputs[fileIndex].type === 'file' 
          ? validInputs[fileIndex].file?.name || `File ${fileIndex + 1}`
          : `URL ${fileIndex + 1}`;
          
        fileStats.push({
          totalRecords: validItemsCount,
          commonRecords: 0,
          fileName: inputName
        });
      });

      let commonRecordsCount = 0;
      itemsByGId.forEach(items => {
        if (items.length > 1) {
          commonRecordsCount++;
        }
      });

      fileStats.forEach(stat => {
        stat.commonRecords = commonRecordsCount;
      });

      setStats(fileStats);

      const mergedDoc = document.implementation.createDocument('', '', null);
      const rssElement = mergedDoc.createElement('rss');
      rssElement.setAttribute('version', '2.0');
      rssElement.setAttribute('xmlns:g', 'http://base.google.com/ns/1.0');
      
      const channelElement = mergedDoc.createElement('channel');
      const titleElement = mergedDoc.createElement('title');
      titleElement.textContent = 'Merged XML Feed';
      channelElement.appendChild(titleElement);

      itemsByGId.forEach((items, gId) => {
        const mergedItem = mergedDoc.createElement('item');
        
        // First, add the g:id element
        const gIdElement = mergedDoc.createElement('g:id');
        gIdElement.textContent = gId;
        mergedItem.appendChild(gIdElement);
        
        // Then merge all other elements from all items
        items.forEach(item => {
          Array.from(item.children).forEach(child => {
            // Skip g:id since we already added it
            if (child.tagName === 'g:id') return;
            
            // Clone the entire element with all its children and attributes
            const clonedElement = mergedDoc.importNode(child, true);
            mergedItem.appendChild(clonedElement);
          });
        });

        channelElement.appendChild(mergedItem);
      });

      rssElement.appendChild(channelElement);
      mergedDoc.appendChild(rssElement);

      const serializer = new XMLSerializer();
      const xmlString = serializer.serializeToString(mergedDoc);
      const formattedXml = formatXml('<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString);
      
      setMergedXml(formattedXml);

      // Scroll to result section
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);

    } catch (error) {
      console.error('Error merging XML files:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadMergedXml = () => {
    if (!mergedXml) return;

    const blob = new Blob([mergedXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          XML Merger Tool
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">XML Sources</h2>
          
          {xmlInputs.map((input, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-600">XML Source {index + 1}</h3>
                {xmlInputs.length > 2 && (
                  <button
                    onClick={() => removeXmlInput(index)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="flex gap-4 mb-3">
                <label className="flex items-center text-gray-600">
                  <input
                    type="radio"
                    name={`input-type-${index}`}
                    checked={input.type === 'url'}
                    onChange={() => updateXmlInput(index, { type: 'url', value: '', file: undefined })}
                    className="mr-2 text-gray-500"
                  />
                  URL
                </label>
                <label className="flex items-center text-gray-600">
                  <input
                    type="radio"
                    name={`input-type-${index}`}
                    checked={input.type === 'file'}
                    onChange={() => updateXmlInput(index, { type: 'file', value: '', file: undefined })}
                    className="mr-2 text-gray-500"
                  />
                  File Upload
                </label>
              </div>
              
              {input.type === 'url' ? (
                <input
                  type="url"
                  value={input.value}
                  onChange={(e) => updateXmlInput(index, { value: e.target.value })}
                  placeholder={`Enter XML URL ${index + 1}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              ) : (
                <div>
                  <input
                    type="file"
                    accept=".xml,application/xml,text/xml"
                    onChange={(e) => handleFileUpload(index, e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                  {input.file && (
                    <p className="text-sm text-gray-600 mt-1">Selected: {input.file.name}</p>
                  )}
                </div>
              )}
            </div>
          ))}
          
          <button
            onClick={addXmlInput}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Add Another XML Source
          </button>
        </div>


        <div className="text-center mb-6">
          <button
            onClick={mergeXmlFiles}
            disabled={isProcessing}
            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Merge XML Files'}
          </button>
        </div>

        {stats.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">File Statistics</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left text-gray-800">File</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-gray-800">Total Records</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-gray-800">Common Records (by g:id)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2 text-gray-800">{stat.fileName}</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-800">{stat.totalRecords}</td>
                      <td className="border border-gray-300 px-4 py-2 text-gray-800">{stat.commonRecords}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {mergedXml && (
          <div ref={resultRef} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Merged XML Ready</h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  placeholder="File name"
                />
                <span className="text-gray-500">.xml</span>
                <button
                  onClick={downloadMergedXml}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Download
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Successfully merged XML files. Click the download button to save the merged file.
            </p>
            <div className="bg-gray-100 p-4 rounded-md max-h-60 overflow-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {mergedXml.substring(0, 1000)}
                {mergedXml.length > 1000 && '...'}
              </pre>
            </div>
          </div>
        )}
      </div>
      
      <footer className="mt-12 text-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm p-4 max-w-4xl mx-auto">
          <p className="text-gray-600 text-sm">
            © 2024 Not George Technologies. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}