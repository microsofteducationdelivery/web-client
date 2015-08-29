import React, { Component } from 'react';
import styles from './style.css';
import fontAwesome from 'font-awesome-webpack'; // eslint-disable-line no-unused-vars

export default class IconButton extends Component {

  static propTypes = {
    icon: React.PropTypes.string,
    tooltipText: React.PropTypes.string,
    handleClick: React.PropTypes.func,
  }


  constructor(props) {
    super(props);
    this.state = {
      isTooltipVisible: false,
    };
  }

  showTooltip() {
    this.setState({
      isTooltipVisible: true,
    });
  }

  hideTooltip() {
    this.setState({
      isTooltipVisible: false,
    });
  }

  render() {
    let tooltip;
    if (this.state.isTooltipVisible) {
      tooltip = <div className={styles.tooltip}><div className={styles.tooltipInner}>{this.props.tooltipText}</div></div>;
    }

    return (
      <div onMouseEnter={::this.showTooltip} onMouseLeave={::this.hideTooltip} className={styles.iconButton}>
        <button onClick={this.props.handleClick} className={styles.btn}>
          <i className={this.props.icon}></i>
        </button>
        { tooltip }
      </div>
    );
  }
}