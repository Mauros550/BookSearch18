// Client/src/pages/SearchBooks.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import {
  Container,
  Col,
  Form,
  Button,
  Card,
  Row
} from 'react-bootstrap';
import Auth from '../utils/auth';
import { saveBookIds, getSavedBookIds } from '../utils/localStorage';
import { useMutation } from '@apollo/client';
import { SAVE_BOOK } from '../utils/mutations';
import { GET_ME } from '../utils/queries';

import type { GoogleAPIBook } from '../models/GoogleAPIBook';

interface BookData {
  bookId: string;
  authors: string[];
  title: string;
  description: string;
  image: string;
  link: string;
}

const SearchBooks: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchedBooks, setSearchedBooks] = useState<BookData[]>([]);
  const [savedBookIds, setSavedBookIds] = useState<string[]>(getSavedBookIds());

  // Apollo mutation for saving a book
  const [saveBook] = useMutation(SAVE_BOOK, {
    refetchQueries: [{ query: GET_ME }],
  });

  // persist saved IDs on unmount
  useEffect(() => {
    return () => saveBookIds(savedBookIds);
  }, [savedBookIds]);

  const handleSearchBooks = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchInput) return;

    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          searchInput
        )}`
      );
      const { items = [] } = await response.json();
      const books: BookData[] = items.map((b: GoogleAPIBook) => ({
        bookId: b.id,
        authors: b.volumeInfo.authors || ['No author to display'],
        title: b.volumeInfo.title,
        description: b.volumeInfo.description,
        image: b.volumeInfo.imageLinks?.thumbnail || '',
        link: b.volumeInfo.infoLink || b.volumeInfo.previewLink || '',
      }));
      setSearchedBooks(books);
      setSearchInput('');
    } catch (err) {
      console.error('Error fetching from Google Books:', err);
    }
  };

  const handleSaveBook = async (bookId: string) => {
    if (!Auth.loggedIn()) return;
    const bookToSave = searchedBooks.find((b) => b.bookId === bookId);
    if (!bookToSave) return;

    try {
      await saveBook({ variables: { input: bookToSave } });
      setSavedBookIds((prev) => [...prev, bookId]);
    } catch (err) {
      console.error('Error saving book:', err);
    }
  };

  return (
    <>
      <Container className="my-4">
        <Form onSubmit={handleSearchBooks}>
          <Row>
            <Col xs={12} md={8}>
              <Form.Control
                name="searchInput"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                type="text"
                placeholder="Search for a book"
              />
            </Col>
            <Col xs={12} md={4}>
              <Button type="submit" variant="success">
                Submit Search
              </Button>
            </Col>
          </Row>
        </Form>
      </Container>

      <Container>
        <h2 className="pt-3">
          {searchedBooks.length
            ? `Viewing ${searchedBooks.length} results:`
            : 'Search for a book to begin'}
        </h2>
        <Row>
          {searchedBooks.map((book) => (
            <Col md={4} key={book.bookId} className="mb-3">
              <Card border="dark">
                {book.image && (
                  <Card.Img
                    src={book.image}
                    alt={`Cover for ${book.title}`}
                    variant="top"
                  />
                )}
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <Card.Text>{book.description}</Card.Text>
                  {Auth.loggedIn() && (
                    <Button
                      disabled={savedBookIds.includes(book.bookId)}
                      onClick={() => handleSaveBook(book.bookId)}
                      variant="info"
                    >
                      {savedBookIds.includes(book.bookId)
                        ? 'Book Already Saved'
                        : 'Save This Book!'}
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SearchBooks;
