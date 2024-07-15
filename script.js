import { browser } from 'k6/browser';
import { check } from 'k6';
import {data_table_pages, web_pages, home_page_buttons, search_pages, search_terms} from './k6_helpers/urls.js';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const debug_mode = true;
const base_url = __ENV.HOSTNAME;

// k6 run --config k6_helpers/smoke_test.json -e HOSTNAME=https://dev.fec.gov script.js

// Run Options: 

// Use smoke_test.json to verify that system works under minimal laod and to gather baseline performace vaules.
// https://grafana.com/blog/2024/01/30/smoke-testing/ 
// under 5 VUs, short duration (30s to 2m) duration 


export async function paginateDatables() {
    
    const page = await browser.newPage();
    const url = randomItem(data_table_pages);
    const full_url = base_url.concat(url);

    try {
    await page.goto(full_url);
    
    if (debug_mode){
    console.log(full_url);
    }
    
    const button = page.locator('//a[text()="Next"]');   
    await button.click();
    
    const loading_animation = page.locator('.overlay.is-loading');
   
    await loading_animation.waitFor({
        state: 'hidden',
      });    


    const result_info = await page.locator('#results_info').innerHTML();
    check(result_info, {
        result_info: (h) => h.startsWith("Showing 31"),
    });

    } finally {
        if (debug_mode) {
            await page.screenshot({ path: 'k6_helpers/screenshots/datatablePagination.png' });
        }
        await page.close();
    }

}
//need to suppress some warnings 
export async function browseWebpages() {
    const page = await browser.newPage();
    const url = randomItem(web_pages);
    const full_url = base_url.concat(url);

    try {
        await page.goto(base_url); //go to home page 
       
        var button_locator = "//a[text()=\"{}\"]";
        button_locator = button_locator.replace("{}", randomItem(home_page_buttons));
        
        const button = page.locator(button_locator);   

        await Promise.all([ //click random home page button and wait for navigation 
            page.waitForNavigation(),
            button.click(), 
          ]);
        
        if (debug_mode) {
            await page.screenshot({ path: 'k6_helpers/screenshots/browse_webpage_1.png' });
        }
        
        await page.goto(full_url); // go  to another random page 
        
        if (debug_mode){
        console.log(full_url);
        }
        const test_url = page.url();
        check(test_url, {
            test_url: (h) => h == full_url,
        });
    
        } finally {
            if (debug_mode) {
                await page.screenshot({ path: 'k6_helpers/screenshots/browse_webpage_2.png' });
            }
            await page.close();
        }
}

export async function searchWebsite() {
    const page = await browser.newPage();
    const url = randomItem(search_pages);
    const full_url = base_url.concat(url);
    const search_term = randomItem(search_terms);
    try {
        await page.goto(full_url);

        if(url.includes("legal")){
            await searchLegal(page, search_term);
        }
        else {
            await searchWeb(page, search_term);
        }
    
    }finally{
        if (debug_mode) {
            await page.screenshot({ path: 'k6_helpers/screenshots/searchWebsite.png' });
        }
        await page.close();
    }
}

async function searchWeb(page, search_term){
    
    await page.locator('[aria-owns="search_listbox"]').type(search_term);
    
    await Promise.all([
        page.waitForNavigation(),
        page.locator('.button--search.button--cta').click(),
      ]);

    var nav_item = await page.innerHTML('.side-nav__item');

    check(nav_item, {
        nav_item: (h) => (h.includes("Candidates") || h.includes("Committees") || h.includes("Other") || h.includes("Suggestions")),
      });
    
    const button = await page.$('//a[text()="View more"]');   
    
    if(button !== null) {

        await Promise.all([
            page.waitForNavigation(),
            button.click(),
          ]);

        const loading_animation = page.locator('.overlay.is-loading');
   
        await loading_animation.waitFor({
              state: 'hidden',
            });    
      
    }
    
}
async function searchLegal(page, search_term ) {
    const input_box = await page.locator('[aria-label="Search for legal documents"]');
    
    await input_box.type(search_term); 
    
    await Promise.all([
        page.waitForNavigation(),
        input_box.press('Enter'),
      ]);

    const header = await page.locator("h1").textContent();
    check(header, {
        header: (h) => h.startsWith("Results for"),
      });
    
}