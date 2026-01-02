// ActivitiesListScreen.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Row, Col } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import { useGetActivitiesQuery, useCreateActivityMutation, useDeleteActivityMutation } from '../../slices/activitiesSlice.js';
import { toast } from 'react-toastify';
import CustomButton from '../../components/CustomButton.jsx'; // Import the CustomButton

const ActivitiesListScreen = () => {
  const { data: activities, isLoading, error, refetch } = useGetActivitiesQuery();
  const [createActivity, { isLoading: loadingCreate }] = useCreateActivityMutation();
  const [deleteActivity, { isLoading: loadingDelete }] = useDeleteActivityMutation();

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await deleteActivity(id);
        toast.success('Activity deleted');
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error || 'An error occurred');
      }
    }
  };

  const createActivityHandler = async () => {
    if (window.confirm('Are you sure you want to create a new activity?')) {
      try {
        await createActivity();
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error || 'An error occurred');
      }
    }
  };

  return (
    <>
      <Row className='align-items-center'>
        <Col>
          <h1>Activities</h1>
        </Col>
        <Col className='text-end'>
          <CustomButton
            onClick={createActivityHandler}
            text='Create Activity'
            icon={<FaPlus />}
            className='m-3'
          />
        </Col>
      </Row>

      {loadingCreate && <Loader />}
      {loadingDelete && <Loader />}
      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error.message || 'An error occurred'}</Message>
      ) : (
        <>
          <Table striped hover responsive className='table-sm'>
            <thead>
              <tr>
                <th>ID</th>
                <th>NAME</th>
                <th>DIFFICULTY LEVEL</th>
                <th>TYPE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity._id}>
                  <td>{activity._id}</td>
                  <td>{activity.name}</td>
                  <td>{activity.difficultyLevel}</td>
                  <td>{activity.type || 'N/A'}</td>
                  <td>
                    <Link to={`/admin/activities/${activity._id}/edit`} className='mx-2'>
                      <CustomButton
                        text=''
                        icon={<FaEdit />}
                        style={{ padding: '0.5em 0.75em' }}
                      />
                    </Link>
                    <CustomButton
                      onClick={() => deleteHandler(activity._id)}
                      text=''
                      icon={<FaTrash />}
                      className='delete-button'
                      style={{ padding: '0.5em 0.75em' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </>
  );
};

export default ActivitiesListScreen;
