// Client/src/pages/SavedBooks.tsx

import React from 'react';
import {
  Container,
  Card,
  Button,
  Row,
  Col
} from 'react-bootstrap';
import { useQuery, useMutation } from '@apollo/client';
import Auth from '../utils/auth';
import { removeBookId } from '../utils/localStorage';
import { GET_ME } from '../utils/queries';
import { REMOVE_BOOK } from '../utils/mutations';

// 1) Define the shape of a saved book
interface BookData {
  bookId: string;
  authors: string[];
  title: string;
  description: string;
  image: string;
  link?: string;
}

// 2) Define the shape of the "me" query response
interface MeData {
  me: {
    _id: string;
    username: string;
    email: string;
    savedBooks: BookData[];
  };
}

const SavedBooks: React.FC = () => {
  // 3) Use a generic to type the result of GET_ME
  const { loading, data } = useQuery<MeData>(GET_ME);
  const [removeBook] = useMutation(REMOVE_BOOK, {
    refetchQueries: [{ query: GET_ME }],
  });

  if (loading) {
    return <h2>LOADING...</h2>;
  }

  // 4) Now data!.me.savedBooks is typed as BookData[]
  const savedBooks = data?.me.savedBooks || [];
  const username = data?.me.username || '';

  const handleDeleteBook = async (bookId: string) => {
    if (!Auth.loggedIn()) return;

    try {
      await removeBook({ variables: { bookId } });
      removeBookId(bookId);
    } catch (err) {
      console.error('Error removing book:', err);
    }
  };

  return (
    <>
      <div className="text-light bg-dark p-5 mb-4">
        <Container>
          <h1>
            Viewing {username ? `${username}'s` : ''} saved books!
          </h1>
        </Container>
      </div>

      <Container>
        <h2 className="pt-3">
          {savedBooks.length
            ? `Viewing ${savedBooks.length} saved ${savedBooks.length === 1 ? 'book' : 'books'}:`
            : 'You have no saved books!'}
        </h2>
        <Row>
          {savedBooks.map((book: BookData) => (
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
                  <p className="small">Authors: {book.authors.join(', ')}</p>
                  <Card.Text>{book.description}</Card.Text>
                  <Button
                    className="btn-block btn-danger"
                    onClick={() => handleDeleteBook(book.bookId)}
                  >
                    Delete this Book!
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;
