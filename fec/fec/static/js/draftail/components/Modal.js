import React from 'react';

const Cancel = ({handleClose}) => (
  <div
    className='modal-close'
    onClick={() => handleClose()}
    style={{
      backgroundColor: 'rgb(51,51,51)',
      border: 'solid 3px #fff',
      boxShadow: '1px 1px 5px rgb(51,51,51)',
      borderRadius: '100%',
      cursor: 'pointer',
      float: 'right',
      height: '15px',
      margin: '10px',
      padding: '3px',
      textAlign: 'center',
      verticalAlign: 'middle',
      width: '15px'
    }}
  >
    <strong
      style={{
        color: '#fff',
        position: 'relative',
        top: '-2px'
      }}
    >
      x
    </strong>
  </div>
);

const Title = ({title}) => (
  <h2
    style={{
      padding: '5px 0',
      margin: '10px'
    }}
  >
    {title}
  </h2>
);

const Modal = ({children, handleClose, title}) => (
  <div
    style={{
      backgroundColor: '#fff',
      border: 'solid 1px rgb(50,50,50)',
      boxShadow: '5px 5px 20px rgb(50,50,50)',
      width: '200px',
      height: 'auto',
      display: 'block',
      left: 'calc(50% - 100px)',
      padding: '10px 20px',
      pointerEvents: 'auto',
      position: 'fixed',
      top: 'calc(50% - 100px)',
      zIndex: '100'
    }}
  >
    <Cancel handleClose={handleClose} />
    <Title title={title}/>
    {children}
  </div>
);

Modal.defaultProps = {
  handleClose: () => {},
  title: ''
};


export default Modal;
