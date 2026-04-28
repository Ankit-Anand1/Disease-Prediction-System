/**
 * DiseasePredict — PDF Report Download
 * Libraries: html2canvas 1.4.1 + jsPDF 2.5.1 (Cloudflare CDN)
 */
function downloadReport(disease) {
  const btn = document.getElementById('downloadBtn');
  if (!btn) return;

  // Button → loading state
  btn.classList.add('loading');
  const btnLabel = btn.querySelector('.btn-label');
  if (btnLabel) btnLabel.textContent = 'Generating PDF…';

  const target = document.getElementById('reportTarget');

  // Temporarily expand for capture: show header, hide action row
  target.classList.add('pdf-capture');
  const actionsEl = target.querySelector('.result-actions');
  if (actionsEl) actionsEl.style.display = 'none';

  // Wait one frame so display changes render
  requestAnimationFrame(() => setTimeout(() => {
    html2canvas(target, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: target.scrollWidth,
      windowHeight: target.scrollHeight,
      logging: false,
    }).then(canvas => {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const PAGE_W = 210, PAGE_H = 297, MARGIN = 12;
      const usableW = PAGE_W - MARGIN * 2;
      const imgH = (canvas.height / canvas.width) * usableW;
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Multi-page support
      const pageContentH = PAGE_H - MARGIN * 2;
      const totalPages = Math.ceil(imgH / pageContentH);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        const yShift = -i * pageContentH;
        pdf.addImage(imgData, 'PNG', MARGIN, MARGIN + yShift, usableW, imgH);

        // Clip overflow with white rectangle
        if (i < totalPages - 1) {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, PAGE_H - MARGIN + 0.5, PAGE_W, MARGIN + 1, 'F');
        }

        // Footer on each page
        pdf.setFontSize(8);
        pdf.setTextColor(160, 160, 160);
        pdf.text(
          `DiseasePredict  |  Educational purposes only  |  Page ${i+1} of ${totalPages}`,
          PAGE_W / 2, PAGE_H - 4, { align: 'center' }
        );
      }

      const now = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
      pdf.save(`DiseasePredict_${disease}_Report_${stamp}.pdf`);

      // Restore UI
      target.classList.remove('pdf-capture');
      if (actionsEl) actionsEl.style.display = '';
      btn.classList.remove('loading');
      if (btnLabel) btnLabel.textContent = 'Download PDF';

    }).catch(err => {
      console.error('PDF error:', err);
      target.classList.remove('pdf-capture');
      if (actionsEl) actionsEl.style.display = '';
      btn.classList.remove('loading');
      if (btnLabel) btnLabel.textContent = 'Download PDF';
      alert('PDF generation failed. Please try again.');
    });
  }, 80));
}
