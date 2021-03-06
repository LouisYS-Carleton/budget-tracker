let db;

// Requests
const request = window.indexedDB.open("budget", 1);
request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("pending", { keyPath: "id", autoIncrement: true });
};
request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};
request.onerror = function (event) {
  console.log(event);
};

// saveRecord/checkDatabase Functions
function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite");
  const objectStore = transaction.objectStore("pending");

  objectStore.add(record);
}

function checkDatabase() {
  const transaction = db.transaction(["pending"]);
  const objectStore = transaction.objectStore("pending");
  const getAll = objectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          const transaction = db.transaction(["pending"], "readwrite");
          const objectStore = transaction.objectStore("pending");

          objectStore.clear();
        });
    }
  };
}

// Listen for reconnect
window.addEventListener("online", checkDatabase);
