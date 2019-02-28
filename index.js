const request = require("request-promise");
const cheerio = require("cheerio");
const ObjectsToCsv = require("objects-to-csv");

const url = "https://sfbay.craigslist.org/search/jjj?s=0";

// const scrapeJobHeader = {
//   title: "Ruby on Rails Developer",
//   description:
//     "Customer Lobby is seeking an experienced Ruby on Rails Developer to add to our team in Oakland, CA. You'll work with an incredible, product-focused team in a fun, supportive office environment. You will also be working with a high performing team of Engineers in India. If you are passionate about making a huge impact at a growing company, we would love to talk! ",
//   datePosted: new Date("2019-02-20"),
//   url:
//     "https://sfbay.craigslist.org/eby/sof/d/oakland-ruby-on-rails-developer/6823629744.html",
//   hood: "(oakland downtown)",
//   address: "475 14th Street",
//   compesation: "Competitive Salary DOE"
// };

const scrapeResults = [];

async function scrapeJobHeader() {
  try {
    const htmlResult = await request.get(url);
    const $ = await cheerio.load(htmlResult);

    // geting the info of the jobs
    $(".result-info").each((index, element) => {
      // loop through all jobs
      const resultTitle = $(element).children(".result-title"); // select the 'result-title' html class
      const title = resultTitle.text(); // get the job title
      const url = resultTitle.attr("href"); // get the job link
      const datePosted = new Date(
        $(element)
          .children(".result-date")
          .attr("datetime")
      );
      const hood = $(element)
        .find(".result-hood")
        .text();
      const scrapeResult = { title, url, datePosted, hood }; // create an object
      scrapeResults.push(scrapeResult); // push on the results array
    });

    //console.log(scrapeResults);
    return scrapeResults;
  } catch (err) {
    console.error(err);
  }
}

async function scrapeDescription(jobsWithHeaders) {
  return await Promise.all(
    jobsWithHeaders.map(async job => {
      try {
        const htmlResult = await request.get(job.url);
        const $ = await cheerio.load(htmlResult);
        $(".print-qrcode-container").remove();
        job.description = $("#postingbody").text();
        job.address = $("div.mapaddress").text();
        const compenstionText = $(".attrgroup")
          .children()
          .first()
          .text();
        job.compensation = compenstionText.replace("compensation: ", "");
        return job;
      } catch (error) {
        console.log(error);
      }
    })
  );
}

async function createCsvFile(data) {
  let csv = new ObjectsToCsv(data);

  // Save to file:
  await csv.toDisk("./test.csv");

  // Return the CSV file as string:
  //console.log(await csv.toString());
}

async function scrapeCraiglist() {
  const jobsWithHeaders = await scrapeJobHeader();
  const jobsFullData = await scrapeDescription(jobsWithHeaders);
  await createCsvFile(jobsFullData);
  //console.log(jobsFullData);
  console.log(scrapeResults.length);
}

scrapeCraiglist();
