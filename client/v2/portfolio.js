// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/*
Description of the available api
GET https://clear-fashion-api.vercel.app/

Search for specific products

This endpoint accepts the following optional query string parameters:

- `page` - page of products to return
- `size` - number of products to return

GET https://clear-fashion-api.vercel.app/brands

Search for available brands list
*/

// current products on the page
let currentProducts = [];
let currentPagination = {};XMLDocument
let currentBrand = "noBrand";

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectBrand = document.querySelector('#brand-select')
const sectionProducts = document.querySelector('#products');
const spanNbProducts = document.querySelector('#nbProducts');
const recentCheckBox = document.querySelector('#recent-check');
const reasonnableCheckBox = document.querySelector('#price-check');
const selectSort = document.querySelector('#sort-select');
const spanNbBrands = document.querySelector('#nbBrands');
const spanNbRecent = document.querySelector('#nbRecent');
const spanp50 = document.querySelector('#p50');
const spanp90 = document.querySelector('#p90');
const spanp95 = document.querySelector('#p95');
const spanLatest = document.querySelector('#date_latest');
const favCheckbox = document.querySelector('#fav-check');

/**
 * Set global value
 * @param {Array} result - products to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentProducts = ({result, meta}) => {
  currentProducts = result;
  currentPagination = meta;
};

/**
 * Fetch products from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=3000] - size of the page
 * @return {Object}
 */

const filterRecent = product => {
  const recentProducts = product.filter(function(ob){
    const date = new Date(ob.released);
    return date > new Date(new Date - 1209600000);  });
  return recentProducts;
}

const fetchAll = async(page = 1, size = 12, brand="noBrand", recent=false, reasonable=false, sort="price-asc", fav=false) => {
  try {
    let apiLink;

    if(brand!="noBrand"){
      apiLink = `https://clear-fashion-api.vercel.app?page=1&size=3000&brand=${brand}`
    }
    else{
      apiLink = `https://clear-fashion-api.vercel.app?page=1&size=3000`
    }
    const response = await fetch(apiLink);
    let body = await response.json();
    console.log(body);

    if (body.success !== true) {
      console.error(body);
      return {currentProducts, currentPagination};
    }

    /* Je compte le nombre de nouveaux produits :*/
    spanNbRecent.innerHTML = filterRecent(body.data.result).length;

    /* je filtre les produits, ainsi la pagination est calculée après le filtrage*/
    if(recent){
      body.data.result = filterRecent(body.data.result);
    }

    if(reasonable){
      body.data.result = body.data.result.filter(function(prod){
        return prod.price <= 50;
      });
    }

    if(fav){
      body.data.result = body.data.result.filter(function(prod){
        return favList.includes(prod.uuid);
      })
    }

    /*j'affiche les brands dispo*/
    renderBrands(brand, body.data.result);

    const count = body.data.result.length;

    /*Je calcule la date du plus récent produit en triant la db*/
    body.data.result.sort(function(a, b) {return new Date(a.released) - new Date(b.released);});
    spanLatest.innerHTML = body.data.result[0].released;

    /* Je calcule p50, p90 et p95 après Tri de la db*/
    body.data.result.sort(function(a, b) {return a.price - b.price;});

    const p50 = body.data.result[Math.floor(count*0.5)].price;
    spanp50.innerHTML = p50.toString();

    const p90 = body.data.result[Math.floor(count*0.1)].price;
    spanp90.innerHTML = p90.toString();

    const p95 = body.data.result[Math.floor(count*0.05)].price;
    spanp95.innerHTML = p95.toString();
    
    /*Tri des produits*/
    
    if(sort=="price-desc"){
        body.data.result.sort(function(a, b) {
        return b.price - a.price;
      });
    }
    else if(sort=="date-asc"){
      body.data.result.sort(function(a, b) {
        return new Date(b.released) - new Date(a.released);
      });
    }
    else if(sort=="date-desc"){
      body.data.result.sort(function(a, b) {
        return new Date(a.released) - new Date(b.released);
      });
    }

    body.data.result = body.data.result.slice((page-1)*size, page*size);
    body.data.meta = {"count":count,"currentPage":page, "pageCount":Math.ceil(count/size), "pageSize": size};

    spanNbBrands.innerHTML = "8";

    return body.data;
  }
  catch(error){    
    console.error(error);
    return {currentProducts, currentPagination};
  }
}

/**
 * Render list of products
 * @param  {Array} products
 */
const renderProducts = products => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');

  const template = products
    .map(product => {

      let checkString = "";
      if(favList.includes(product.uuid)){
        checkString = "checked";
      }

      return `
      <div class="product" id="ID-${product.uuid}">
        <span>${product.brand}</span>
        <a href="${product.link}">${product.name}</a>x
        <span>${product.price}</span>
        <button onclick="window.open('${product.link}','_blank');">Voir le produit</button>
        <input class="fav-heart" type="checkbox" id="${product.uuid}" ${checkString}>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionProducts.innerHTML = '<h2>Products</h2>';
  sectionProducts.appendChild(fragment);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
  
};

const renderBrands = async(brand, products) => {

  const brands = Array.from(new Set(products.map((item) => item.brand)));

  selectBrand.innerHTML = '<option value="noBrand">All</option>';
  let brandlist = Array.from(brands, brand => `<option value="${brand}">${brand}</option>`);
  selectBrand.innerHTML += brandlist.join('');
  selectBrand.value = brand;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const {count} = pagination;

  spanNbProducts.innerHTML = count;
};

let favList = JSON.parse(localStorage.getItem("favList"));

const render = (products, pagination, brand) => {
  renderProducts(products);
  renderPagination(pagination);
  renderIndicators(pagination);

  const checkboxes = document.querySelectorAll('.fav-heart');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', event => {
      const checkboxId = event.target.id;
      if (event.currentTarget.checked) {favList.push(checkboxId);}
      else{
        let i = 0;
        while (i < favList.length) {
          if (favList[i] === checkboxId) {
            favList.splice(i, 1);
          } 
          else {
            ++i;
          }
        }
      }
      
      
      localStorage.setItem('favList', JSON.stringify(favList));
    });
  });
};

/**
 * Declaration of all Listeners
 */

/**
 * Select the number of products to display
 */

let show = 12;
let brand = "noBrand"
let page = 1;
let recent = false;
let reasonable = false;
let sort = "price-asc";
let fav = false;
selectShow.addEventListener('change', async (event) => {
  const products = await fetchAll(currentPagination.currentPage, parseInt(event.target.value), brand, recent, reasonable, sort, fav);
  show = parseInt(event.target.value);
  setCurrentProducts(products);
  render(currentProducts, currentPagination, brand);
});

selectPage.addEventListener('change', async (event) => {
  const products = await fetchAll(parseInt(event.target.value),currentPagination.pageSize , brand, recent, reasonable, sort, fav);
  page = parseInt(event.target.value);
  setCurrentProducts(products);
  render(currentProducts, currentPagination, brand);
});

selectBrand.addEventListener('change', async (event) => {
  const products = await fetchAll(currentPagination.currentPage, currentPagination.pageSize, event.target.value, recent, reasonable, sort, fav);
  brand = event.target.value;
  setCurrentProducts(products);
  render(currentProducts, currentPagination, brand);
  spanNbBrands.innerHTML = "1";
});

recentCheckBox.addEventListener('change', async(event) => {
  if (event.currentTarget.checked) {
    recent = true;
    const products = await fetchAll(1, currentPagination.pageSize, brand, recent, reasonable, sort, fav);
    setCurrentProducts(products);
    render(currentProducts, currentPagination, brand);
  }
  else{
    recent = false;
    const products = await fetchAll(1, show, brand, recent, reasonable, sort);
    setCurrentProducts(products);
    render(currentProducts, currentPagination,brand);
  }
});

reasonnableCheckBox.addEventListener('change', async(event) => {
  if (event.currentTarget.checked) {
    reasonable = true;
    const products = await fetchAll(1, currentPagination.pageSize, brand, recent, reasonable, sort, fav);
    setCurrentProducts(products);
    render(currentProducts, currentPagination, brand);
  }
  else{
    reasonable = false;
    const products = await fetchAll(1, show, brand, recent, reasonable, sort);
    setCurrentProducts(products);
    render(currentProducts, currentPagination,brand);
  }
});

favCheckbox.addEventListener('change', async(event) => {
  if (event.currentTarget.checked) {
    fav = true;
    const products = await fetchAll(1, currentPagination.pageSize, brand, recent, reasonable, sort, fav);
    setCurrentProducts(products);
    render(currentProducts, currentPagination, brand);
  }
  else{
    fav = false;
    const products = await fetchAll(1, show, brand, recent, reasonable, sort, fav);
    setCurrentProducts(products);
    render(currentProducts, currentPagination,brand);
  }
});

selectSort.addEventListener('change', async (event) => {
  sort = event.target.value;
  const products = await fetchAll(1, show, brand, recent, reasonable, sort);
  setCurrentProducts(products);
  render(currentProducts, currentPagination, brand);
});

document.addEventListener('DOMContentLoaded', async () => {
  const products = await fetchAll();

  setCurrentProducts(products);
  render(currentProducts, currentPagination,brand);
});
