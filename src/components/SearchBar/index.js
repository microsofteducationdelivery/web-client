import React, { Component } from 'react';
import { ListView, reactRenderer as winjsReactRenderer } from 'react-winjs';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { debounce } from 'lodash';
import cx from 'classnames';
import PreviewImage from 'components/PreviewImage';

import { listLayout } from 'common';
import * as actions from 'actions/searchResult';

import styles from './style.css';

@connect(
  (state) => ({ searchResult: state.searchResult }),
  (dispatch) => bindActionCreators(actions, dispatch)
)
export default class SearchBar extends Component {

  static propTypes = {
    searchResult: React.PropTypes.shape({
      entity: React.PropTypes.object.isRequired,
    }),
  };

  static contextTypes = {
    router: React.PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      showSearchList: false,
      searchText: '',
    };
    this.handleClick = ::this._handleClick;
  }
  componentWillMount() {
    document.addEventListener('click', this.handleClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClick);
  }
  userSelected(item) {
    this.context.router.transitionTo('editUser', {
      id: item.data.id.toString(),
    });
  }
  _handleClick(e) {
    const searchTableElem = this.refs.searchList.getDOMNode();
    let currentElem = e.target;

    while (currentElem && this.state.showSearchList) {
      if (searchTableElem === currentElem) {
        break;
      } else {
        currentElem = currentElem.parentElement;
      }
    }
    if (!currentElem) {
      this.hideList();
    }
  }

  mediaSelected(item) {
    const routeParams = {
      itemId: item.data.id.toString(),
      itemType: 'media',
    };
    if (!item.data.FolderId) {
      routeParams.folderId = 'library' + item.data.LibraryId;
    }
    this.context.router.transitionTo('folderSelection', routeParams);
    this.hideList();
  }

  highlightCurrentSearch(currentString) {
    const startIndex = currentString.toLowerCase().indexOf(this.state.searchText.toLowerCase());
    if (startIndex === -1) {
      return <span>{currentString}</span>;
    }

    const prefix = currentString.substr(0, startIndex);
    const postfix = currentString.substr(startIndex + this.state.searchText.length);

    return <span>{prefix}<span className={styles.red}>{this.state.searchText}</span>{postfix}</span>;
  }

  hideList() {
    this.setState({
      showSearchList: false,
      searchText: '',
    });
  }

  async debounceFunction(value) {
    await this.props.loadSearchResult(value);
    this.setState({
      showSearchList: true,
      searchText: value,
    });
  }
  inputHandler = debounce((value) => {
    if (!value) {
      this.hideList();
      return;
    }
    this.debounceFunction(value);
  }, 500);

  listViewSearchUserItemRenderer = winjsReactRenderer((item) => {
    return (
      <div onClick={this.userSelected.bind(item, this)}>
        {this.highlightCurrentSearch(item.data.name)}
      </div>
    );
  });

  listViewSearchMediaItemRenderer = winjsReactRenderer((item) => {
    return (
      <div class={styles.notFloat}>
        {item.data.type}
      </div>
    );
  });
  render() {
    return (
      <div className={styles.searchBar} ref="searchList">
        <input type="text" className={styles.input} onInput={(e) => {::this.inputHandler(e.target.value); }} />

        {this.state.showSearchList ?
            <div className={cx(styles.list, 'searchList')}>



              <WinJS.UI.Repeater
                itemDataSource={this.props.searchResult.entities.users.dataSource}
                itemTemplate={this.listViewSearchUserItemRenderer}
                />

            </div> : ''}
      </div>
    );
  }
}