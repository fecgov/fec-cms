const React = require('react');
const PropTypes = require('prop-types');

class TooltipHelp extends React.Component {
  render() {
    return (
      <div className="tooltip__container">
        <button className="tooltip__trigger">
          <span className="u-visually-hidden">Learn more</span>
        </button>
        <div
          className={`tooltip tooltip--${
            this.props.verticalPosition
          } tooltip--${this.props.horizontalPosition}`}
        >
          <p className="tooltip__content tooltip__content">
            {this.props.message}
          </p>
        </div>
      </div>
    );
  }
}

module.exports = TooltipHelp;
