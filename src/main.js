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

/* ========= 登入功能 ========= */
const DEFAULT_PASSWORD = 'chengyun2025';

function checkLogin() {
  const loginInfo = JSON.parse(localStorage.getItem('quotationLoginInfo') || 'null');
  if (!loginInfo || !loginInfo.isLoggedIn) {
    showLoginPage();
    return false;
  }
  return true;
}

function showLoginPage() {
  const loginPage = document.getElementById('loginPage');
  loginPage.style.display = 'flex';
  
  // 清空之前的輸入和錯誤訊息
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').classList.remove('show');
  
  // 聚焦到密碼輸入框
  setTimeout(() => {
    document.getElementById('loginPassword').focus();
  }, 100);
}

function hideLoginPage() {
  const loginPage = document.getElementById('loginPage');
  loginPage.style.display = 'none';
}

function login() {
  const password = document.getElementById('loginPassword').value;
  const errorElement = document.getElementById('loginError');
  
  if (password === DEFAULT_PASSWORD) {
    localStorage.setItem('quotationLoginInfo', JSON.stringify({
      isLoggedIn: true,
      loginTime: new Date().toISOString()
    }));
    
    // 隱藏登入頁面
    hideLoginPage();
    
    // 顯示登出按鈕
    document.getElementById('logoutBtn').classList.remove('d-none');
    
    // 清除錯誤訊息
    errorElement.classList.remove('show');
  } else {
    // 顯示錯誤訊息
    errorElement.classList.add('show');
    
    // 清空密碼輸入框並聚焦
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginPassword').focus();
    
    // 3秒後自動隱藏錯誤訊息
    setTimeout(() => {
      errorElement.classList.remove('show');
    }, 3000);
  }
}

function logout() {
  if (confirm('確定要登出系統嗎？')) {
    localStorage.removeItem('quotationLoginInfo');
    showLoginPage();
    document.getElementById('logoutBtn').classList.add('d-none');
  }
}

function togglePassword() {
  const passwordInput = document.getElementById('loginPassword');
  const toggleButton = document.getElementById('passwordToggle');
  const icon = toggleButton.querySelector('i');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icon.className = 'bi bi-eye-slash';
  } else {
    passwordInput.type = 'password';
    icon.className = 'bi bi-eye';
  }
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
    clientTax: document.getElementById('clientTax').value,
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

/* ========= 匯出 ========= */
function exportJSON(){
  const data = {meta:collectMeta(),items:collectItems()};
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (document.getElementById('quoteNo').value || 'quotation') + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCSV(){
  const items = collectItems();
  if(!items.length){ alert('無項目資料可匯出'); return; }
  
  const headers = ['name','desc','unit','qty','price','discount'];
  const csvContent = [
    headers.join(','),
    ...items.map(item => headers.map(h => `"${(item[h] || '').toString().replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const blob = new Blob(['\uFEFF' + csvContent], {type: 'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (document.getElementById('quoteNo').value || 'quotation') + '_items.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
        
        // 處理兩種可能的 JSON 格式
        if (Array.isArray(data)) {
          // 直接是項目陣列的情況 (demo.json 的格式)
          if (data.length) {
            populateItems(data);
            alert('已匯入 JSON');
          } else {
            alert('JSON 內容無有效項目');
          }
        } else if (data && Array.isArray(data.items) && data.items.length) {
          // 包含 items 陣列的物件格式
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
  
  // 處理備註/條款的顯示問題
  const notesTextarea = document.getElementById('notes');
  const notesDisplay = document.getElementById('notesDisplay');
  
  // 將textarea內容轉換為HTML格式（保留換行）
  const notesContent = notesTextarea.value
    .split('\n')
    .filter(line => line.trim() !== '') // 過濾空行
    .map(line => `<p style="margin-bottom:0.5rem;line-height:1.5;">${line}</p>`)
    .join('');
    
  // 設置顯示內容 - 使用內聯樣式確保PDF渲染時樣式不丟失
  notesDisplay.innerHTML = notesContent;
  notesDisplay.style.position = 'static'; // 改為靜態定位，避免絕對定位造成的問題
  notesDisplay.style.display = 'block';
  notesDisplay.style.width = '100%';
  notesDisplay.style.border = '1px solid #dee2e6';
  notesDisplay.style.borderRadius = '0.375rem';
  notesDisplay.style.padding = '0.5rem';
  notesDisplay.style.fontSize = '0.875rem';
  notesDisplay.style.backgroundColor = 'white';
  
  // 顯示格式化的div，隱藏textarea
  notesDisplay.classList.remove('d-none');
  notesTextarea.classList.add('d-none');
  
  // 給DOM一點時間更新
  setTimeout(() => {
    const element = document.querySelector('.container-fluid');
    const opt = {
      // 設成 0 移除 html2pdf 預設 0.5‑inch 頁邊距
      margin: 0,
      filename: (document.getElementById('quoteNo').value || 'quotation') + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        // 保證擷取完整寬度，避免 canvas 截圖時產生額外留白
        scrollY: 0,
        // 增加延遲，確保DOM更新完成
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
        logging: false,
        onclone: function(clonedDoc) {
          // 在克隆的文檔中再次確保備註顯示正確
          const clonedTextarea = clonedDoc.getElementById('notes');
          const clonedDisplay = clonedDoc.getElementById('notesDisplay');
          if(clonedTextarea && clonedDisplay) {
            const content = clonedTextarea.value
              .split('\n')
              .filter(line => line.trim() !== '') // 過濾空行
              .map(line => `<p style="margin-bottom:0.5rem;line-height:1.5;">${line}</p>`)
              .join('');
            clonedDisplay.innerHTML = content;
            clonedDisplay.style.position = 'static'; // 改為靜態定位
            clonedDisplay.style.display = 'block';
            clonedDisplay.style.width = '100%';
            clonedDisplay.style.border = '1px solid #dee2e6';
            clonedDisplay.style.borderRadius = '0.375rem';
            clonedDisplay.style.padding = '0.5rem';
            clonedDisplay.style.fontSize = '0.875rem';
            clonedDisplay.style.backgroundColor = 'white';
            clonedDisplay.classList.remove('d-none');
            clonedTextarea.classList.add('d-none');
          }
        }
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      // 避免標題與表格被切到新頁
      pagebreak: { mode: ['avoid-all'] }
    };
    
    // 使用Promise來確保PDF生成後恢復原始狀態
    html2pdf().set(opt).from(element).save().then(() => {
      // PDF生成後恢復原始狀態
      setTimeout(() => {
        notesDisplay.classList.add('d-none');
        notesTextarea.classList.remove('d-none');
        // 恢復原始樣式
        notesDisplay.style.position = '';
        notesDisplay.style.display = '';
        notesDisplay.style.width = '';
        notesDisplay.style.border = '';
        notesDisplay.style.borderRadius = '';
        notesDisplay.style.padding = '';
        notesDisplay.style.fontSize = '';
        notesDisplay.style.backgroundColor = '';
      }, 1000); // 給予足夠時間完成PDF生成
    });
  }, 100); // 給DOM更新的時間
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
  
  // 登入相關初始化
  const loginInfo = JSON.parse(localStorage.getItem('quotationLoginInfo') || 'null');
  if (loginInfo && loginInfo.isLoggedIn) {
    document.getElementById('logoutBtn').classList.remove('d-none');
    hideLoginPage();
  } else {
    document.getElementById('logoutBtn').classList.add('d-none');
    showLoginPage();
  }
  
  // 登入按鈕事件
  document.getElementById('loginBtn').addEventListener('click', login);
  
  // 登出按鈕事件
  document.getElementById('logoutBtn').addEventListener('click', logout);
  
  // 密碼顯示/隱藏切換
  document.getElementById('passwordToggle').addEventListener('click', togglePassword);
  
  // 按Enter鍵登入
  document.getElementById('loginPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      login();
    }
  });
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
  exportJSON,
  exportCSV,
  exportPDF,
  applyTemplate,
  adjustColWidth,
  login,
  logout,
  showLoginPage,
  hideLoginPage,
  togglePassword
});
