const React = require('react');
const PropTypes = require('prop-types')

class TooltipHelp extends React.Component {
  constructor(props) {
    super(props)
    this.state = { enableTooltip: props.addTooltip}
  }
  render() {

    return (
      <div className="tooltip__container">
       <button className="tooltip__trigger"><span className="u-visually-hidden">Learn more</span></button>
         <div className={`tooltip tooltip--${this.props.verticalPosition} tooltip--${this.props.horizontalPosition}`}>
            <p className="tooltip--content">{this.props.message}</p>
         </div>
        {this.props.children}
      </div>
    )
  }
}





module.exports = TooltipHelp;