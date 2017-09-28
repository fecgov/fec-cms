const React = require('react');

class FilterPanel extends React.Component {
constructor(props) {
  super(props);
  this.state = {expanded: props.startOpen};
  this.toggle = this.toggle.bind(this);
}

toggle() {
  this.setState({'expanded': !this.state.expanded});
}

render() {
    return <li>
      <button className="accordion__button" aria-controls={this.props.id} aria-expanded={this.state.expanded}
      onClick={this.toggle}>
        {this.props.header}
      </button>
      <div className="accordion__content filters-inner" id={this.props.id} hidden={!this.state.expanded}>
        {this.props.children}
      </div>
    </li>
}
}

module.exports = FilterPanel;
