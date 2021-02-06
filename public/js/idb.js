let db;

// establish a connection to IndexedDB 
const request = indexedDB.open('budget_tracker', 1);


request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function (event) {
    // saves to db
    db = event.target.result;

    // if online send saved data from offline    
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};

// if it's offline this function will execute
function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('new_transaction');
    transactionObjectStore.add(record);
}

function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const transactionObjectStore = transaction.objectStore('new_transaction');

    // get all records from store and set a variable
    const getAll = transactionObjectStore.getAll();

    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_transaction'], 'readwrite');
                    const transactionObjectStore = transaction.objectStore('new_transaction');
                    transactionObjectStore.clear();

                    alert('All saved transactions have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

// listening for the app to come back online
window.addEventListener('online', uploadTransaction);