/* ========= 工具函式 ========= */
function numClean(v){
  if(typeof v !== 'string') v = String(v ?? '');
  v = v.replace(/,/g,'').replace(/[^\d.-]/g,'');
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}
function fmt(n){
  return (+n || 0).toLocaleString();
}

/* ========= 動態列操作 ========= */
function addRow(){
  const tbody = document.querySelector('#itemTable tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="text-center"><input type="checkbox" class="row-chk"></td>
    <td><input type="text" class="form-control form-control-sm item-name"></td>
    <td><textarea class="form-control form-control-sm item-desc" rows="1"></textarea></td>
    <td><input type="text" class="form-control form-control-sm item-unit" value="組"></td>
    <td><input type="number" class="form-control form-control-sm item-qty" value="1" min="1" inputmode="decimal"></td>
    <td><input type="text" class="form-control form-control-sm item-price" value="0" inputmode="decimal"></td>
    <td><input type="text" class="form-control form-control-sm item-discount" value="0" inputmode="decimal"></td>
    <td class="text-end fw-bold item-subtotal">0</td>
  `;
  tbody.appendChild(tr);
  updateRowSubtotal(tr);
  calculateTotal();
}

function duplicateRow(){
  const tbody = document.querySelector('#itemTable tbody');
  [...tbody.querySelectorAll('tr')].forEach(row=>{
    if(row.querySelector('.row-chk').checked){
      const clone = row.cloneNode(true);
      clone.querySelector('.row-chk').checked = false;
      tbody.appendChild(clone);
      updateRowSubtotal(clone);
    }
  });
  calculateTotal();
}

function deleteSelected(){
  const tbody = document.querySelector('#itemTable tbody');
  [...tbody.querySelectorAll('tr')].forEach(row=>{
    if(row.querySelector('.row-chk').checked){
      row.remove();
    }
  });
  if(!tbody.querySelector('tr')) addRow(); // 至少保留一列
  calculateTotal();
}

function toggleAll(source){
  const checked = source.checked;
  document.querySelectorAll('#itemTable tbody .row-chk').forEach(cb=>cb.checked = checked);
}

/* ========= 計算 ========= */
function updateRowSubtotal(row){
  const qty = numClean(row.querySelector('.item-qty')?.value ?? 0);
  const price = numClean(row.querySelector('.item-price')?.value ?? 0);
  const discount = numClean(row.querySelector('.item-discount')?.value ?? 0);
  const subtotal = Math.max(qty*price - discount, 0);
  row.querySelector('.item-subtotal').textContent = fmt(subtotal);
  return subtotal;
}

function calculateTotal(){
  const rows = document.querySelectorAll('#itemTable tbody tr');
  let subtotal = 0;
  rows.forEach(r=> subtotal += updateRowSubtotal(r));
  const taxRate = numClean(document.getElementById('taxRate').value);
  const tax = subtotal * (taxRate/100);
  const total = subtotal + tax;
  document.getElementById('subtotal').textContent = 'NT$ ' + fmt(subtotal);
  document.getElementById('tax').textContent = 'NT$ ' + fmt(tax);
  document.getElementById('total').textContent = 'NT$ ' + fmt(total);
}

/* ========= 欄寬調整 ========= */
function adjustColWidth(amount){
  const root = document.documentElement;
  const cur = parseInt(getComputedStyle(root).getPropertyValue('--col-name-width') || '180',10);
  let next = cur + amount;
  if(next < 100) next = 100;
  if(next > 400) next = 400;
  root.style.setProperty('--col-name-width', next+'px');
  const slider = document.getElementById('colWidthSlider');
  if(slider) slider.value = next;
}

/* ========= 暫存 / 載入 ========= */
function collectMeta(){
  return {
    quoteDate: document.getElementById('quoteDate').value,
    quoteNo: document.getElementById('quoteNo').value,
    eventName: document.getElementById('eventName').value,
    eventDate: document.getElementById('eventDate').value,
    eventTime: document.getElementById('eventTime').value,
    venue: document.getElementById('venue').value,
    account: document.getElementById('account').value,
    taxRate: document.getElementById('taxRate').value,
    paymentTerm: document.getElementById('paymentTerm').value,
    validDays: document.getElementById('validDays').value,
    clientCompany: document.getElementById('clientCompany').value,
    clientContact: document.getElementById('clientContact').value,
    clientPhone: document.getElementById('clientPhone').value,
    clientAddress: document.getElementById('clientAddress').value,
    clientFax: document.getElementById('clientFax').value,
    clientMobile: document.getElementById('clientMobile').value,
    clientEmail: document.getElementById('clientEmail').value,
    vendorCompany: document.getElementById('vendorCompany').value,
    vendorTax: document.getElementById('vendorTax').value,
    vendorContact: document.getElementById('vendorContact').value,
    vendorEmail: document.getElementById('vendorEmail').value,
    vendorPhone: document.getElementById('vendorPhone').value,
    vendorAddress: document.getElementById('vendorAddress').value,
    notes: document.getElementById('notes').value
  };
}

function applyMeta(m){
  if(!m) return;
  for(const k of Object.keys(m)){
    const el = document.getElementById(k);
    if(el) el.value = m[k];
  }
}

function collectItems(){
  const items = [];
  document.querySelectorAll('#itemTable tbody tr').forEach(tr=>{
    items.push({
      name: tr.querySelector('.item-name').value,
      desc: tr.querySelector('.item-desc').value,
      unit: tr.querySelector('.item-unit').value,
      qty: tr.querySelector('.item-qty').value,
      price: tr.querySelector('.item-price').value,
      discount: tr.querySelector('.item-discount').value
    });
  });
  return items;
}

function populateItems(items){
  const tbody = document.querySelector('#itemTable tbody');
  tbody.innerHTML='';
  (items||[]).forEach(it=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-center"><input type="checkbox" class="row-chk"></td>
      <td><input type="text" class="form-control form-control-sm item-name" value="${it.name||''}"></td>
      <td><textarea class="form-control form-control-sm item-desc" rows="1">${it.desc||''}</textarea></td>
      <td><input type="text" class="form-control form-control-sm item-unit" value="${it.unit||'組'}"></td>
      <td><input type="number" class="form-control form-control-sm item-qty" value="${it.qty||1}" min="1" inputmode="decimal"></td>
      <td><input type="text" class="form-control form-control-sm item-price" value="${it.price||0}" inputmode="decimal"></td>
      <td><input type="text" class="form-control form-control-sm item-discount" value="${it.discount||0}" inputmode="decimal"></td>
      <td class="text-end fw-bold item-subtotal">0</td>`;
    tbody.appendChild(tr);
    updateRowSubtotal(tr);
  });
  calculateTotal();
}

function saveDraft(){
  const data = {meta:collectMeta(),items:collectItems()};
  localStorage.setItem('quotationDraft', JSON.stringify(data));
  alert('已暫存資料');
}

function loadDraft(){
  const raw = localStorage.getItem('quotationDraft');
  if(!raw){ alert('無暫存資料'); return; }
  try{
    const data = JSON.parse(raw);
    applyMeta(data.meta);
    populateItems(data.items);
    alert('已載入暫存資料');
  }catch(err){
    alert('暫存資料格式不正確');
  }
}

function clearDraft(){
  if(confirm('確認清除暫存？')){
    localStorage.removeItem('quotationDraft');
    alert('已清除暫存資料');
  }
}

/* ========= 匯入 ========= */
function importFile(evt){
  const file = evt.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e=>{
    const txt = e.target.result;
    if(file.name.endsWith('.json')){
      try{
        const data = JSON.parse(txt);
        if (data && Array.isArray(data.items) && data.items.length) {
          applyMeta(data.meta || {});
          populateItems(data.items);
          alert('已匯入 JSON');
        } else {
          alert('JSON 內容無有效項目');
        }
      }catch(err){
        alert('JSON 格式錯誤');
      }
    }else if(file.name.endsWith('.csv')){
      importCSV(txt);
    }else{
      alert('不支援的檔案類型');
    }
  };
  reader.readAsText(file);
  evt.target.value='';
}

function importCSV(csvText){
  const lines = csvText.trim().split(/\r?\n/);
  if(lines.length<2){ alert('CSV 無資料'); return; }
  const header = lines[0].split(',');
  const items=[];
  for(let i=1;i<lines.length;i++){
    const cols = lines[i].split(',');
    const it={};
    header.forEach((h,idx)=> it[h.trim()] = cols[idx] ? cols[idx].trim() : '');
    items.push({
      name:it.name||'',
      desc:it.desc||'',
      unit:it.unit||'',
      qty:it.qty||1,
      price:it.price||0,
      discount:it.discount||0
    });
  }
  if (items.length) {
    populateItems(items);
    alert('已匯入 CSV');
  } else {
    alert('CSV 內容無有效項目，保留原表格');
  }
}

/* ========= PDF ========= */
function exportPDF(){
  // 更新產生時間
  document.getElementById('generatedAt').textContent = new Date().toLocaleString();
  const element = document.querySelector('.container-fluid');
  const opt = {
    // 設成 0 移除 html2pdf 預設 0.5‑inch 頁邊距
    margin:       0,
    filename:     (document.getElementById('quoteNo').value || 'quotation') + '.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  {
      scale: 2,
      useCORS: true,
      // 保證擷取完整寬度，避免 canvas 截圖時產生額外留白
      scrollY: 0
    },
    jsPDF:        { unit:'in', format:'a4', orientation:'portrait' },
    // 避免標題與表格被切到新頁
    pagebreak:    { mode: ['avoid-all'] }
  };
  html2pdf().set(opt).from(element).save();
}

/* ========= 模板 ========= */
const TEMPLATE_STORE_KEY = 'quoteTemplates';
if(!localStorage.getItem(TEMPLATE_STORE_KEY)){
  localStorage.setItem(TEMPLATE_STORE_KEY, JSON.stringify([
    {name:'網站建置',desc:'五頁靜態官網',unit:'案',qty:1,price:30000,discount:0},
    {name:'維護費',desc:'一年維護服務',unit:'年',qty:1,price:12000,discount:0}
  ]));
}
function applyTemplate(){
  const items = JSON.parse(localStorage.getItem(TEMPLATE_STORE_KEY)||'[]');
  if(!items.length){ alert('尚未建立模板'); return; }
  populateItems(items);
}

/* ========= 事件綁定 ========= */
document.getElementById('itemTable').addEventListener('input', e=>{
  if(['item-qty','item-price','item-discount'].some(cls=> e.target.classList.contains(cls))){
    updateRowSubtotal(e.target.closest('tr'));
    calculateTotal();
  }
});
document.getElementById('itemTable').addEventListener('blur', e=>{
  if(['item-price','item-discount'].some(cls=> e.target.classList.contains(cls))){
    e.target.value = fmt(numClean(e.target.value));
  }
}, true);

document.getElementById('colWidthSlider').addEventListener('input', e=>{
  document.documentElement.style.setProperty('--col-name-width', e.target.value+'px');
});

document.getElementById('taxRate').addEventListener('input', calculateTotal);

/* ========= 初始化 ========= */
document.addEventListener('DOMContentLoaded', ()=>{
  // 設定初始欄寬 CSS 變數
  document.documentElement.style.setProperty('--col-name-width','180px');
  document.getElementById('generatedAt').textContent = new Date().toLocaleString();
  calculateTotal();
});

/* ========= 將需供 HTML 直接呼叫的函式掛到全域 ========= */
Object.assign(window, {
  addRow,
  duplicateRow,
  deleteSelected,
  toggleAll,
  saveDraft,
  loadDraft,
  clearDraft,
  importFile,
  exportPDF,
  applyTemplate,
  adjustColWidth
});
