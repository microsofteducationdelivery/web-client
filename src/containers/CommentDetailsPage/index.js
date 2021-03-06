import React, { Component } from 'react';
import { ListView, reactRenderer as winjsReactRenderer } from 'react-winjs';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as actions from '../../actions/media-comments';
import { listLayout } from 'common';
import Modal from 'components/Modal';
import loading from 'decorators/loading';
import ActionButton from 'components/ActionButton';
import ActionButtonForModal from 'components/ActionButtonForModal';
import Footer from 'components/Footer';
import WhiteFooter from 'components/WhiteFooter';
import Header from 'components/Header';
import cx from 'classnames';
import { onEnterPressed } from '../../common/index.js';
import { isInputField } from '../../common/index.js';

import style from './style.css';
import commonStyles from 'common/styles.css';

@connect(
  (state) => ({comments: state.activeComment, user: state.currentUser, pendingActions: state.pendingActions}),
  (dispatch) => bindActionCreators(actions, dispatch)
)
@loading(
  (state) => state.comments.loading,
  { isLoadingByDefault: true }
)
export default class CommentDetails extends Component {

  static propTypes = {
    comments: React.PropTypes.object.isRequired,
    params: React.PropTypes.object.isRequired,
    user: React.PropTypes.object.isRequired,
    deleteComments: React.PropTypes.func.isRequired,
    pendingActions: React.PropTypes.object.isRequired,
    createComment: React.PropTypes.func.isRequired,
    loadComments: React.PropTypes.func.isRequired,
  };
  constructor(props) {
    super(props);

    props.loadComments(this.props.params.id);
    this.handleKeyDown = ::this._handleKeyDown;
    this.state = {
      loading: true,
      modalWindow: {},
      selectionComments: [],
      selectOnLoad: '',
      selectItem: {},
      newCommentText: '',
    };
  }

  componentWillReceiveProps(props) {
    if (props === this.props) {
      return;
    }
    this.setState({ loading: props.comments.loading});
  }

  onCommentTextInputChange(event) {
    this.setState({
      newCommentText: event.target.value,
    });
  }

  replyAll() {
    this.setState({
      isNewCommentPopupOpen: true,
      modalWindow: {
        title: `To ${ this.props.params.mediaName }`,
      },
    });
  }

  replyAllEnter(e) {
    if (e.keyCode === 13) {
      this.replyAll();
    }
  }

  componentWillMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  componentDidUpdate() {
    if (this.state.selectItem && this.state.selectOnLoad) {
      this.refs.comments.winControl.selection.set(this.state.selectItem);
      setImmediate(() => this.refs.comments.winControl.ensureVisible(this.state.selectItem));
      this.setState({selectOnLoad: false});
    }
  }

  _handleKeyDown(e) {
    if(isInputField(e) ||  this.state.isNewCommentPopupOpen
      || this.state.isEditCommentPopupOpen || this.state.isDeleteCommentsPopupOpen) {
      return;
    }
    const key = String.fromCharCode(e.keyCode);
    if (key === 'A' && e.ctrlKey) {
      e.preventDefault();
      this.refs.comments.winControl.selection.selectAll();
    }
    if (e.keyCode === 27 ) {
      this.refs.comments.winControl.selection.clear();
    }
    if (e.keyCode === 46) {
      this.deleteComments();
    }
  }

  replyToCommentState(item) {
    this.setState({
      id: this.props.params.id,
      isNewCommentPopupOpen: true,
      parentId: item.data.id,
      modalWindow: {
        title: `To ${ item.data.author }`,
      },
    });
  }

  replyToCommentEnterState(item, event) {
    if (event.keyCode === 13) {
      this.replyToCommentState(item);
    }
  }

  async editCommentState(item) {
    const editDataComment = {
      isEditCommentPopupOpen: true,
      id: item.data.id,
      newCommentText: item.data.text,
      replay: 'Edit',
      modalWindow: {
        title: 'Edit',
      },
    };
    if (item.data.parentId) {
      editDataComment.parentId = item.data.parentId;
    }
    this.setState(editDataComment);
  }

  editCommentEnterState (item, event) {
    if (event.keyCode === 13) {
      this.editCommentState(item);
    }
  }

  groupInfo() {
    return {
      enableCellSpanning: true,
      cellWidth: 100,
      cellHeight: 80,
    };
  }

  itemInfo(dataId) {
    const elemData = this.props.comments.entity.data.getItem(dataId).data;
    /* 110 is right margin for content */
    const elemWidth = this.refs.comments.getDOMNode().offsetWidth - 110;
    const testElem = document.createElement('div');
    testElem.innerHTML = elemData.text;
    document.body.insertBefore(testElem, document.body.firstChild);
    testElem.style.width = elemWidth + 'px';
    testElem.classList.add(style.testDiv);
    /* total item height = number of cells * base cell height + win-container top margin + win-container bottom margin  */
    const heightBody = Math.ceil(testElem.offsetHeight * 1.4 + 10) + 5 + 5;
    document.body.removeChild(testElem);
    return {width: 900, height: heightBody};
  }

  async editComment(item) {
    const editData = {
      id: this.state.id,
      text: this.state.newCommentText,
      author: this.props.user.name,
    };
    if (this.state.parentId) {
      editData.parentId = this.state.parentId;
    }

    await this.props.updateComment(editData);
    this.props.loadComments(this.props.params.id);
    this.setState({ newCommentText: '', isEditCommentPopupOpen: false});
  }

  showDeleteCommentsPopup() {
    this.setState({
      isDeleteCommentsPopupOpen: true,
    });
  }

  async handleSelectionChange(e) {
    const items = await e.target.winControl.selection.getItems();

    this.setState({
      selectionComments: items.map( (item) => (item.data.id)),
    });
  }

  async deleteComments() {
    if (this.state.selectionComments.length === 0) {
      return;
    }

    await this.props.deleteComments(this.state.selectionComments);
    this.setState({selectionComments: []});
    this.hideDeleteCommentsPopup();
    this.props.loadComments(this.props.params.id);
  }

  async handleItemSelected(event) {
    const item = await event.detail.itemPromise;
    this.setState({
      selectItem: item,
      selectOnLoad: true,
    });
  }

  async createNewComment() {
    const newCommentData = {
      id: this.props.params.id,
      text: this.state.newCommentText,
      author: this.props.user.name,
    };

    if (this.state.parentId) {
      newCommentData.parentId = this.state.parentId;
    }

    await this.props.createComment(newCommentData);
    this.props.loadComments(this.props.params.id);
    this.setState({
      newCommentText: '',
      isNewCommentPopupOpen: false,
      parentId: '',
    });
  }

  hideNewCommentPopup() {
    this.setState({
      isNewCommentPopupOpen: false,
      newCommentText: '',
      parentId: '',
    });
  }

  hideEditCommentPopup() {
    this.setState({
      isEditCommentPopupOpen: false,
      newCommentText: '',
      parentId: '',
    });
  }

  hideDeleteCommentsPopup() {
    this.setState({
      isDeleteCommentsPopupOpen: false,
    });
  }

  renderAnswerToComments() {
    return (
      <Modal
        isOpen={this.state.isNewCommentPopupOpen}
        title={this.state.modalWindow.title}
        className={style.commentModal}>
        <form onSubmit={::this.createNewComment}>
          <label>
            <div className={style.labelName}>Message:</div>
          <textarea
            className={style.textArea}
            type="text"
            placeholder="i.e. English"
            autoFocus
            value={this.state.newCommentText}
            onChange={::this.onCommentTextInputChange}
            role="Text for new comment"
            />
          </label>
        </form>
        <WhiteFooter>
          <ActionButtonForModal
            className={commonStyles.saveButtonModal}
            onClick={::this.createNewComment}
            disabled={!this.state.newCommentText.length}
            inProgress={this.props.pendingActions.newComment}
            role="OK button"
            >
            Send
          </ActionButtonForModal>
          <ActionButtonForModal className={commonStyles.cancelButtonModal} onClick={::this.hideNewCommentPopup} role="Cancel button">Cancel</ActionButtonForModal>
        </WhiteFooter>
      </Modal>);
  }

  renderEditComments() {
    return (<Modal
      isOpen={this.state.isEditCommentPopupOpen}
      title={this.state.modalWindow.title}
      className={style.commentModal}
      >
      <form onSubmit={::this.editComment}>
        <label >
          <div className={style.labelName}>Message:</div>
          <textarea
            className={style.textArea}
            type="text"
            placeholder="i.e. English"
            autoFocus
            value={this.state.newCommentText}
            onChange={::this.onCommentTextInputChange}
            role="Text for edit comment"
            />
        </label>
      </form>
      <WhiteFooter>
        <ActionButtonForModal
          className={commonStyles.saveButtonModal}
          onClick={::this.editComment}
          disabled={!this.state.newCommentText.length}
          inProgress={this.props.pendingActions.newComment || this.props.pendingActions.editComment}
          role="OK button">
          Send
        </ActionButtonForModal>
        <ActionButtonForModal className={commonStyles.cancelButtonModal} onClick={::this.hideEditCommentPopup} role="Cancel button">Cancel</ActionButtonForModal>
      </WhiteFooter>
    </Modal>);
  }
  renderDeleteLibrariesPopup() {
    return (<Modal
      isOpen={this.state.isDeleteCommentsPopupOpen}
      title="Are you sure you want to delete selected items?"
      className={commonStyles.modal}
      >
      <WhiteFooter>
        <ActionButtonForModal
          className={commonStyles.saveButtonModal}
          onClick={::this.deleteComments}
          disabled={!this.state.selectionComments.length}
          inProgress={this.props.pendingActions.deleteComments}
          >
          Ok
        </ActionButtonForModal>
        <ActionButtonForModal className={commonStyles.cancelButtonModal} onClick={::this.hideDeleteCommentsPopup}>Cancel</ActionButtonForModal>
      </WhiteFooter>
    </Modal>);
  }

  listViewItemRenderer = winjsReactRenderer((item) => {
    const classes = cx({
      [style.itemText]: true,
      [style.level3]: item.data.parentId,
    });

    return (
      <div className={style.tplItem}>
        <div className={classes}>
          <h3 className={style.author}>{item.data.author}</h3>
          <h6 className={style.text}>{item.data.text}</h6>
        </div>
        { (!item.data.parentId  && item.data.author !== this.props.user.name) ? <button className={cx(style.replay, 'win-interactive')} onClick={this.replyToCommentState.bind(this, item)} onKeyDown={onEnterPressed(this.replyToCommentEnterState.bind(this, item))}>reply</button> : '' }

        { (item.data.author === this.props.user.name) ? <button className={cx(style.replay, 'win-interactive')} onClick={this.editCommentState.bind(this, item)} onKeyDown={onEnterPressed(this.editCommentEnterState.bind(this, item))}>edit</button> : '' }
      </div>
    );
  });

    render() {
    return (
      <div className={style.commentBlock}>
        { this.renderDeleteLibrariesPopup() }
        {this.renderAnswerToComments()}
        {this.renderEditComments()}
        <Header>
          {this.props.params.mediaName}
        </Header>

        <div className={style.commentsContent}>

          <div className={style.toolbar}>
            <span className={style.title} role={ `Commentaries for media ${this.props.params.mediaName} `}>Commentaries</span>
            <div className={style.toolbarBtn} onClick={::this.replyAll} onKeyDown={onEnterPressed(::this.replyAllEnter)}  tabIndex="0">REPLY ALL</div>
          </div>
          <ListView
            ref="comments"
            className={style.list}
            itemDataSource={this.props.comments.entity.data.dataSource}
            itemTemplate={this.listViewItemRenderer}
            onItemInvoked={::this.handleItemSelected}
            onSelectionChanged={::this.handleSelectionChange}
            layout={{groupInfo: ::this.groupInfo, itemInfo: ::this.itemInfo, type: WinJS.UI.CellSpanningLayout }} />

        </div>
        <Footer>

          <ActionButton
            disabled={this.state.selectionComments.length === 0}
            onClick={::this.showDeleteCommentsPopup}
            icon="mdl2-delete"
            tooltipText="Delete button">
          </ActionButton>
        </Footer>
      </div>
    );
  }
}
