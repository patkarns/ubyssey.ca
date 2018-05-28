import React, { Component } from 'react'
import DispatchAPI from '../api/dispatch'

import Cookies from 'universal-cookie';
 
const cookies = new Cookies();

const COLOR_OPACITY = .8

class Poll extends Component {
  constructor(props){
    super(props);
    this.state = {
      answers: [],
      answer_ids: [],
      votes: [],
      checkedAnswers: [],
      hasVoted: false,
      pollQuestion: '',
      loading: true,
    }
  }

  componentDidMount() {
    //initialize poll with results if user already voted
    if(cookies.get('voted') === 'true'){
      this.setState({
        hasVoted: true
      })
    }
    DispatchAPI.polls.getResults(this.props.id)
      .then((response)=> {
        let answers = []
        let votes = []
        let answer_ids = []

        for(let answer of response.answers){
          answers.push(answer['name'])
          votes.push(answer['vote_count'])
          answer_ids.push(answer['id'])
        }
        this.setState({
          answers: answers,
          answer_ids: answer_ids,
          votes: votes,
          pollQuestion: response.question,
          loading: false,
        })
      })
  }

  changeAnswers(e, index){
    if(!this.state.hasVoted){

      let deselect = false
      let newCheckedAnswers = this.state.checkedAnswers

      if(this.state.checkedAnswers.includes(index)) {
        newCheckedAnswers.splice(this.state.checkedAnswers.indexOf(index), 1)
        deselect = true
      }

      else if(!this.props.many){
        newCheckedAnswers = []
        newCheckedAnswers.push(index)      
      }

      else if(this.props.many){
        newCheckedAnswers.push(index)
      }

      this.setState({
        checkedAnswers: newCheckedAnswers,
      }, () => {
        if(!deselect){
          if(this.props.many){
            //wait for vote submit
          }else{
            this.onVote();
          }
        }
      })
    }
  }

  onVote() {
      let newVotes = this.state.votes
      for(let i = 0; i < this.state.checkedAnswers.length; i++) {
        newVotes[this.state.checkedAnswers[i]]++;
      }
      this.setState({
        votes: newVotes,
        hasVoted: true
      }, () => {
        for(let index of this.state.checkedAnswers){
          // console.log(this.state.answer_ids[index])
          let payload = {'answer_id': this.state.answer_ids[index]}
          DispatchAPI.polls.vote(payload)
        }
      })
      if(cookies.get('voted') === 'true'){
        alert('You may only vote once')
      } else {
        cookies.set('voted', 'true', { path: '/' });
      }
  }

  editVote() {
    this.setState({
      hasVoted: false
    })
  }

  getPollResult(index) {
    let total = this.state.votes.reduce((acc, val) => { return acc + val; })
    let width = String((100*this.state.votes[index]/total).toFixed(0)) + '%'
    return width
  }

  render() {
    const pollStyle = this.state.hasVoted ? 'poll-results' : 'poll-voting'
    const buttonStyle = this.state.hasVoted ? 'poll-button-voted': 'poll-button-no-vote'
    const showResult = this.state.hasVoted ? COLOR_OPACITY : 0
    const notShowResult = this.state.hasVoted ? 0 : COLOR_OPACITY
    return (
      <div>
        {!this.state.loading && 
          <div className={['poll-container', pollStyle].join(' ')}>
          <h1>{this.state.pollQuestion}</h1>
          <form className={'poll-answer-form'}>
            {this.state.answers.map((answer, index) =>{
              if(this.props.many){
                let selected = this.state.checkedAnswers.includes(index) ? 'selected' : ''
                return (
                  <label className={['block', buttonStyle].join(' ')}>
                    <input className={['poll-button', selected].join(' ')} 
                      name={answer} 
                      type={'radio'} 
                      value={answer}
                      checked={this.state.checkedAnswers.includes(index)}
                      onChange={(e) => this.changeAnswers(e, index)}>
                      {answer}
                    </input>
                    <div className={'poll-result-bar'} style={{width: this.getPollResult(index)}}> </div>
                  </label>
                )
              }else{
                let isSelected = this.state.checkedAnswers.includes(index) ? 'poll-selected' : 'poll-not-selected'
                return (
                  <label className={['poll-button-label', buttonStyle].join(' ')}>
                    
                    <input className={'poll-input'} 
                      name={'answer'} 
                      type={'radio'} 
                      value={answer}
                      checked={this.state.checkedAnswers.includes(index)}
                      onChange={(e) => this.changeAnswers(e, index)}>
                        <span className={'poll-answer-text'}>{answer}</span>
                    </input>

                    <span className={'poll-button'}
                      style={{opacity: notShowResult}}>
                      <span className={'poll-button-inner'}></span>
                    </span>

                    <span className={'poll-percentage'}
                      style={{opacity: showResult}}>
                      {this.getPollResult(index)}
                    </span>

                    <div className={'poll-result-bar'} 
                      style={{width: this.getPollResult(index), opacity: showResult}}>
                        <div className={isSelected}>                      
                          <span className={'poll-checkmark'}></span>
                        </div>
                    </div>

                  </label>
                )
              }
            })}
          </form>
          {this.state.hasVoted && <button className={'poll-edit-button'} onClick={() => this.editVote()}>Edit Vote</button>}
        </div>
        }
        {this.state.loading && 'Loading Poll...'}
      </div>
    );
  }
}

export default Poll