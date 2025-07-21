
    // ------- 初始化 -------
    document.getElementById('quoteDate').valueAsDate = new Date();
    document.getElementById('generatedAt').textContent = new Date().toLocaleString();

    // 事件委派：即時計算
    document.getElementById('itemTable').addEventListener('input', function (e) {
      if (['item-qty','item-price','item-discount'].some(cls => e.target.classList.contains(cls))) {
        updateRowSubtotal(e.target.closest('tr'));
        calculateTotal();
      }
    });

    // -------- functions --------
    function addRow(){
      const tbody = document.querySelector('#itemTable tbody');
      const template = tbody.querySelector('tr').cloneNode(true);
      template.querySelectorAll('input, textarea').forEach(el=>{
        if(el.type==='checkbox'){el.checked=false;}
        else{el.value = (el.classList.contains('item-unit')? '組' : '');}
      });
      template.querySelector('.item-qty').value = 1;
      template.querySelector('.item-price').value = 0;
      template.querySelector('.item-subtotal').textContent = '0';
      tbody.appendChild(template);
    }

    function deleteSelected(){
      const tbody = document.querySelector('#itemTable tbody');
      tbody.querySelectorAll('.row-chk:checked').forEach(chk=>{
        if(tbody.rows.length>1){ chk.closest('tr').remove(); }
      });
      calculateTotal();
    }

    function toggleAll(mainChk){
      document.querySelectorAll('.row-chk').forEach(c=>c.checked=mainChk.checked);
    }

    function updateRowSubtotal(row){
      const qty      = parseFloat(row.querySelector('.item-qty').value.replace(/,/g,'')) || 0;
      const price    = parseFloat(row.querySelector('.item-price').value.replace(/,/g,'')) || 0;
      const discount = parseFloat(row.querySelector('.item-discount').value.replace(/,/g,'')) || 0;
      const subtotal = qty * price - discount;
      row.querySelector('.item-subtotal').textContent = subtotal.toLocaleString();
    }

    function calculateTotal(){
      const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
      let subtotal = 0;
      document.querySelectorAll('.item-subtotal').forEach(td=>{
        subtotal += parseFloat(td.textContent.replace(/,/g,'')) || 0;
      });
      const tax = Math.round(subtotal * taxRate / 100);
      const total = subtotal + tax;
      document.getElementById('subtotal').textContent = `NT$ ${subtotal.toLocaleString()}`;
      document.getElementById('tax').textContent      = `NT$ ${tax.toLocaleString()}`;
      document.getElementById('total').textContent   = `NT$ ${total.toLocaleString()}`;
    }

    function saveDraft(){
      const items = [];
      document.querySelectorAll('#itemTable tbody tr').forEach(tr=>{
        items.push({
          name: tr.querySelector('.item-name').value,
          desc: tr.querySelector('.item-desc').value,
          unit: tr.querySelector('.item-unit').value,
          qty : +tr.querySelector('.item-qty').value || 0,
          price: +tr.querySelector('.item-price').value || 0
        });
      });
      localStorage.setItem('quoteDraft', JSON.stringify(items));
      alert('已暫存至瀏覽器');
    }

    // 初算一次
    updateRowSubtotal(document.querySelector('#itemTable tbody tr'));
    calculateTotal();



    /* -------- 複製勾選列 -------- */
    function duplicateRow(){
      const tbody = document.querySelector('#itemTable tbody');
      const rows = [...tbody.querySelectorAll('.row-chk:checked')];
      if(!rows.length){ alert('請先勾選要複製的列'); return; }
      rows.forEach(r=>{
        const clone = r.closest('tr').cloneNode(true);
        clone.querySelector('.row-chk').checked = false;
        tbody.appendChild(clone);
        updateRowSubtotal(clone);
      });
      calculateTotal();
    }

    /* -------- 讀取 / 清除 Draft -------- */
    function loadDraft(){
      const data = localStorage.getItem('quoteDraft');
      if(!data){ alert('沒有暫存資料'); return; }
      try{
        populateItems(JSON.parse(data));
      }catch(e){
        alert('暫存資料格式錯誤');
      }
    }
    function clearDraft(){
      localStorage.removeItem('quoteDraft');
      alert('已清除暫存');
    }

    /* -------- 套用欄寬 -------- */
    function applyColWidth(val){
      document.documentElement.style.setProperty('--col-name-width', `${val}px`);
      // 同步套用至標題與各列，避免被其他 inline 樣式覆寫
      document.querySelectorAll('#itemTable th:nth-child(2), #itemTable td:nth-child(2)')
        .forEach(el => el.style.width = `${val}px`);
    }

    /* -------- 欄寬滑桿 -------- */
    const colSlider = document.getElementById('colWidthSlider');
    colSlider.addEventListener('input', e=>{
      applyColWidth(e.target.value);
    });
    // 初始欄寬
    applyColWidth(colSlider.value);

    /* -------- 快捷調整欄寬 -------- */
    function adjustColWidth(delta){
      const slider = document.getElementById('colWidthSlider');
      let newVal = Math.min(+slider.max, Math.max(+slider.min, (+slider.value + delta)));
      slider.value = newVal;
      applyColWidth(newVal);
    }

    /* -------- 匯出 PDF -------- */
    function exportPDF(){
      const element = document.querySelector('.container-fluid');
      const clone = element.cloneNode(true);

      // 將 textarea 內容轉成 div，保留換行
      clone.querySelectorAll('textarea').forEach(txt => {
        const div = document.createElement('div');
        div.style.cssText = 'white-space:pre-wrap;border:1px solid #ced4da;padding:.5rem;border-radius:.25rem;font-size:.875rem;';
        div.textContent = txt.value;
        txt.replaceWith(div);
      });

      html2pdf()
        .set({
          margin: 0,
          filename: 'quotation.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        })
        .from(clone)
        .save();
    }

    /* -------- 匯入 JSON / CSV -------- */
    function importFile(evt){
      const file = evt.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = function(e){
        const txt = e.target.result;
        try{
          let items = [];
          if(file.name.endsWith('.json')){
            items = JSON.parse(txt); // 期望為陣列 [{name,desc,unit,qty,price}]
          }else{
            // 簡易 CSV 解析：name,desc,unit,qty,price (第一行標題將被忽略)
            const lines = txt.trim().split(/\r?\n/).slice(1);
            lines.forEach(l=>{
              const [name,desc,unit,qty,price] = l.split(',');
              items.push({name,desc,unit,qty:+qty,price:+price});
            });
          }
          populateItems(items);
        }catch(err){
          alert('檔案格式錯誤或內容無法解析');
        }
        // 清空 value 以便下次選檔
        evt.target.value='';
      };
      reader.readAsText(file,'utf-8');
    }

    function populateItems(items){
      const tbody = document.querySelector('#itemTable tbody');
      tbody.innerHTML='';
      items.forEach(it=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="text-center"><input type="checkbox" class="row-chk"></td>
          <td><input type="text" class="form-control form-control-sm item-name" value="${it.name||''}"></td>
          <td><textarea class="form-control form-control-sm item-desc" rows="1">${it.desc||''}</textarea></td>
          <td><input type="text" class="form-control form-control-sm item-unit" value="${it.unit||'組'}"></td>
          <td><input type="number" class="form-control form-control-sm item-qty" value="${it.qty||1}" min="1"></td>
          <td><input type="text" class="form-control form-control-sm item-price" value="${it.price||0}" inputmode="decimal"></td>
          <td><input type="text" class="form-control form-control-sm item-discount" value="${it.discount||0}" inputmode="decimal"></td>
          <td class="text-end fw-bold item-subtotal">0</td>
        `;
        tbody.appendChild(tr);
        updateRowSubtotal(tr);
      });
      calculateTotal();
    }
  
// 自動千分位
document.getElementById('itemTable').addEventListener('blur', e=>{
  if(['item-qty','item-price','item-discount'].some(cls => e.target.classList.contains(cls))){
    const val = (+e.target.value || 0);
    e.target.value = val.toLocaleString();
  }
}, true);

// --------- 套用模板功能 ---------
const TEMPLATE_STORE_KEY = 'quoteTemplates';
if (!localStorage.getItem(TEMPLATE_STORE_KEY)) {
  localStorage.setItem(TEMPLATE_STORE_KEY, JSON.stringify([
    {name:'網站建置',desc:'五頁靜態官網',unit:'案',qty:1,price:30000,discount:0},
    {name:'維護費',desc:'一年',unit:'年',qty:1,price:12000,discount:0}
  ]));
}

function applyTemplate(){
  const items = JSON.parse(localStorage.getItem(TEMPLATE_STORE_KEY) || '[]');
  if (items.length) {
    populateItems(items);
  } else {
    alert('尚未建立模板');
  }
}

