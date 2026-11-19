const fs = require('fs');

function completeClosingTags(filePath) {
  let content = fs.readFileSync(filePath, 'utf8').replace(/\r/g, '').trim();

  const closingSnippet = `
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase rounded-xl shadow-lg transition-colors"
                >
                  CONFIRMAR CAMBIO
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
`;

  content += closingSnippet;
  fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
  console.log(`✅ Etiquetas de cierre agregadas exitosamente en: ${filePath}`);
}

completeClosingTags('caja_local/frontend/src/pages/PosTerminal.tsx');
completeClosingTags('caja_movil_app/src/pages/PosTerminal.tsx');
