const fs = require('fs');

function completeClosingTags(filePath) {
  let content = fs.readFileSync(filePath, 'utf8').trim();

  // Si termina en "alert('PIN incorrecto');\n                    }"
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

  if (content.endsWith("alert('PIN incorrecto');\n                    }") || content.endsWith("alert('PIN incorrecto');\r\n                    }")) {
    content += closingSnippet;
    fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
    console.log(`✅ Etiquetas de cierre completadas en: ${filePath}`);
  } else {
    console.log(`Final de archivo en ${filePath}:`, JSON.stringify(content.slice(-100)));
  }
}

completeClosingTags('caja_local/frontend/src/pages/PosTerminal.tsx');
completeClosingTags('caja_movil_app/src/pages/PosTerminal.tsx');
