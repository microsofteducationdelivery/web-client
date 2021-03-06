import React, { Component, PropTypes } from 'react';
import styles from './index.css';
import fontAwesome from 'font-awesome-webpack'; // eslint-disable-line no-unused-vars

export default class Dropdown extends Component {
  static propTypes = {
    title: PropTypes.string,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    value: PropTypes.string,
  };

  render() {
    return (
      <div className={styles.editUser}>
        <label htmlFor="selectUserRole" className={styles.hideLabel}>Account type user:</label>
        <label className={styles.userLabel}>{this.props.title}</label>
        <select className={styles.optionsSelect} name="type"
                disabled={this.props.disabled}
                value={this.props.value}
                onChange={this.props.onChange}
                role="listbox"
                id="selectUserRole"
                required>
            {this.props.children}
        </select>
      </div>
    );
  }
}
