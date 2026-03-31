const fs = require('fs');

const pages = [
  'CartPage.tsx', 'Checkout.tsx', 'Home.tsx', 'Login.tsx', 'OrderHistory.tsx', 'ProductDetail.tsx', 'Register.tsx', 'Shop.tsx'
];

pages.forEach(p => {
  const path = `c:/Users/adisi/OneDrive/Desktop/e-comm-app/frontend/src/pages/${p}`;
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(/\.\.\/\.\.\/api/g, '../api');
    content = content.replace(/\.\.\/\.\.\/store/g, '../store');
    content = content.replace(/\.\.\/\.\.\/contexts/g, '../contexts');
    fs.writeFileSync(path, content);
  }
});

const adminPath = 'c:/Users/adisi/OneDrive/Desktop/e-comm-app/frontend/src/pages/admin/Dashboard.tsx';
if (fs.existsSync(adminPath)) {
  let adminContent = fs.readFileSync(adminPath, 'utf8');
  adminContent = adminContent.replace(/\.\.\/\.\.\/\.\.\//g, '../../');
  fs.writeFileSync(adminPath, adminContent);
}

console.log('Fixed imports');
