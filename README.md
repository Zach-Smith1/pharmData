# pharmData
💊📊🧐

- Place all the functions you want to run in the run.js file

- Alter, comment out, or delete lines of code from run.js as desired

- Then open the terminal (in vscode open built in terminal with ctrl + `) and from within pharmData folder run:
```
node run
```

- Adding ``` all``` to the above command in the CLI will cause the createSpreadsheetData function to include every NDC it encounters; otherwise the function will by default only include NDCs found in allNDCs.txt

- Relevant data will be logged and (if createSpreadsheetData was run) output files will be created within pharmData folder

- When adding new (.txt or .tsv) files run ```dos2unix [filename]``` from the CLI to maintain consistent CRLF formatting