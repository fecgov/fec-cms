const React = require('react');
const PropTypes = require('prop-types')

class TooltipHelp extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      displayTooltip: false
    }
    this.hideTooltip = this.hideTooltip.bind(this)
    this.showTooltip = this.showTooltip.bind(this)
  }

  hideTooltip () {
    this.setState({displayTooltip: false})

  }
  showTooltip () {
    this.setState({displayTooltip: true})
  }

  render() {
    let message = this.props.message
    let position = this.props.position
    return (
      <div className="tooltip__container">
      <button className="tooltip__trigger"
          onMouseOver={this.showTooltip} onMouseLeave={this.hideTooltip}
        >
        {this.state.displayTooltip &&
        <div className={`tooltip--under tooltip--left tooltip-${position}`}>
          <p className="tooltip__content">{message}</p>
        </div>
        }
        {this.props.children}
        </button>
        </div>
    )
  }
}





module.exports = TooltipHelp;