// ==UserScript==
// @name         Export TBody to Excel
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Export the 33rd table's tbody content to an Excel file when \ or ' key is pressed, handling AJAX-loaded tables
// @author       Magenta Project
// @match        https://tunastoyota.crm5.dynamics.com/crmreports/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function cleanPhoneNumber(phone) {
        // Remove all non-numeric characters
        let cleaned = phone.replace(/\D/g, '');
        // If starts with 628, replace with 08
        if (cleaned.startsWith('628')) {
            cleaned = '08' + cleaned.substring(3);
        }
        return cleaned;
    }

    function extractFilenameFromDate(dateString) {
        console.log('Extracting filename from date:', dateString); // Debug log
        let match = dateString.match(/(\d{2})\/(\d{2})\/(\d{2,4})/);
        if (match) {
            let month = match[2].replace(/^0/, ''); // Remove leading zero if any
            let year = match[3];
            if (year.length === 2) {
                year = '20' + year; // Convert '25' to '2025'
            }
            let shortYear = year.slice(-2); // Get last two digits of year
            let filename = month + shortYear;
            console.log('Generated filename:', filename); // Debug log
            return filename;
        }
        console.log('Invalid date format, using default filename'); // Debug log
        return 'export'; // Default name if date format is incorrect
    }

    function tableToCSV(table, filtered = false) {
        let rows = table.querySelectorAll('tr');
        let csvContent = [];
        let allowedColumns = [1, 2, 3, 4, 7, 27, 28, 11, 13, 14, 16, 17, 22, 24, 20, 23].map(n => n - 1);
        let filename = 'export';

        console.log('Total rows detected:', rows.length); // Debug log
        if (rows.length > 2) { // Adjusted to get the third row (index 2)
            let targetRowCells = rows[2].querySelectorAll('td, th');
            console.log('Third row cells detected:', targetRowCells.length); // Debug log
            if (targetRowCells.length > 2) {
                let dateText = targetRowCells[2].innerText.trim();
                console.log('Extracted date text:', dateText); // Debug log
                filename = extractFilenameFromDate(dateText);
            }
        }

        rows.forEach((row, index) => {
            let cells = row.querySelectorAll('td, th');
            let rowData = [];
            if (filtered) {
                allowedColumns.forEach((colIndex, idx) => {
                    if (colIndex < cells.length) {
                        let cellText = cells[colIndex].innerText.trim().replace(/\u00A0/g, '');
                        // If column is 28 (index 27), apply phone number cleaning
                        if (colIndex === 27) {
                            cellText = cleanPhoneNumber(cellText);
                        }
                        rowData.push('"' + cellText.replace(/"/g, '""') + '"');
                    }
                });
            } else {
                cells.forEach((cell, i) => {
                    let cellText = cell.innerText.trim().replace(/\u00A0/g, ''); // Remove non-breaking spaces
                    rowData.push('"' + cellText.replace(/"/g, '""') + '"');
                });
            }
            csvContent.push(rowData.join(','));
        });

        // Remove the first row unconditionally
        if (csvContent.length > 0) {
            csvContent.shift();
        }

        console.log('Final CSV filename:', filename + '.csv'); // Debug log
        return { csv: csvContent.join('\n'), filename };
    }

    function downloadCSV(csvData, filename) {
        let blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        let a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function checkAndExport(filtered = false) {
        let tables = document.querySelectorAll('table');
        console.log('Total tables detected:', tables.length); // Debug log jumlah tabel
        if (tables.length >= 33) {
            let { csv, filename } = tableToCSV(tables[32], filtered); // Get the 33rd table (index 32)
            downloadCSV(csv, filename);
        } else {
            alert('Table 33 not found yet! Please wait and try again.');
        }
    }

    document.addEventListener('keydown', function(event) {
        if (event.key === '\\') { // Detect backslash key
            checkAndExport();
        } else if (event.key === "'") { // Detect single quote key
            checkAndExport(true);
        }
    });

    // Observe DOM changes to detect when the table is loaded
    const observer = new MutationObserver(() => {
        let tables = document.querySelectorAll('table');
        console.log('Tables detected during mutation:', tables.length); // Debug log jumlah tabel saat perubahan terjadi
        if (tables.length >= 33) {
            console.log('Table 33 detected!');
            observer.disconnect(); // Stop observing once the table is found
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
