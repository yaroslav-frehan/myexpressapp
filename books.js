const express = require('express');
const app = express();
app.use(express.json());
const port = 3000;
const books =[
  {id: 1, title: "Book number 1"},
  {id: 2, title: "Book number 2"},
  {id: 3, title: "Book number 3"},
  {id: 4, title: "Book number 4"},
  {id: 5, title: "Book number 5"},
  {id: 6, title: "Book number 6"},
  {id: 7, title: "Book number 7"},
  {id: 8, title: "Book number 8"},
  {id: 9, title: "Book number 9"},
  {id: 10, title: "Book number 10"},
  {id: 11, title: "Book number 11"},
  {id: 12, title: "Book number 12"},
]

app.get('/books', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  try {
    const resBooks = books.slice(startIndex, endIndex);
    res.status(200).json(resBooks);
  } catch (err) {
    res.status(400).json({ error: err.message});
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});