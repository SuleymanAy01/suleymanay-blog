// Decap CMS Keçeli Kalem Vurgu Bileşeni
function registerKeceliKalem() {
  if (window.CMS) {
    window.CMS.registerEditorComponent({
      id: "keceli-kalem",
      label: "✒️ Keçeli Kalem",
      fields: [
        {
          name: "text",
          label: "Vurgulanacak Metin",
          widget: "string"
        }
      ],
      pattern: /^<mark class="keceli-kalem">(.*?)<\/mark>$/,
      fromBlock: function (match) {
        return {
          text: match[1]
        };
      },
      toBlock: function (obj) {
        return `<mark class="keceli-kalem">${obj.text || ''}</mark>`;
      },
      toPreview: function (obj) {
        return `<mark class="keceli-kalem">${obj.text || ''}</mark>`;
      }
    });
  }
}

// CMS hazır olduğunda veya yüklendiğinde tetikle
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', registerKeceliKalem);
} else {
  registerKeceliKalem();
}