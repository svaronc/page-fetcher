const request = require("request");
const fs = require("fs");
const readline = require("readline");

const [url, path] = process.argv.slice(2);

const pageFetcher = function (url, path) {
  return new Promise((resolve, reject) => {
    // make an HTTP request
    request(`https://${url}`, (error, response, body) => {
      if (error) {
        // handle invalid URL
        reject(error);
      } else if (response.statusCode !== 200) {
        // handle HTTP errors
        reject(`HTTP error! status: ${response.statusCode}`);
      } else {
        // check if the file already exists
        fs.stat(path, (statError, stats) => {
          if (statError) {
            // handle invalid file path
            reject("Invalid file path");
          } else {
            // create a readline interface to interact with the user
            const rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout,
            });

            if (stats.isFile()) {
              // ask the user if they want to overwrite the file
              rl.question(
                "File already exists. Overwrite? (Y/n): ",
                (answer) => {
                  if (answer.toLowerCase() === "y") {
                    // overwrite the file
                    fs.writeFile(path, body, (writeError) => {
                      if (writeError) {
                        // handle write error
                        reject(writeError);
                      } else {
                        // Close the readline interface and resolve the promise
                        rl.close();
                        resolve(body);
                      }
                    });
                  } else {
                    // User chooses not to overwrite, close the interface, and reject
                    rl.close();
                    reject("Operation canceled.");
                  }
                }
              );
            } else {
              // File doesn't exist, so write the file
              fs.writeFile(path, body, (writeError) => {
                if (writeError) {
                  // Handle write error
                  reject(writeError);
                } else {
                  // Close the readline interface and resolve the promise
                  rl.close();
                  resolve(body);
                }
              });
            }
          }
        });
      }
    });
  });
};

pageFetcher(url, path)
  .then(() => {
    const stats = fs.statSync(path);
    console.log(`Downloaded and saved ${stats.size} bytes to ${path}`);
  })
  .catch((error) => {
    console.log(error);
  });