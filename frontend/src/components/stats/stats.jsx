import React from 'react';
import StatItem from './stat_item';

export default class Ranks extends React.Component {
  componentDidMount() {
    this.props.fetchStats();

    const closeModal = document.getElementById("close-stats-modal");
    closeModal.addEventListener('click', () => {
      const stats = document.getElementById("stats-modal");
      stats.classList.add("hidden");
    });

    // Click anywhere else to close
    // const statsModal = document.getElementById("stats-modal");
    // statsModal.addEventListener('click', function(e) {
    //   if (e.target === this) return;
    //   statsModal.classList.add("hidden");
    // });
  }

  render() {
    if (!this.props.stats) return <div>Loading...</div>

    const stats = this.props.stats.map(stat => {
      return <StatItem stat={stat} key={stat._id} />
    })
    return (
      <div className="stats-modal hidden" id="stats-modal">
        <p className="close-modal" id="close-stats-modal">X</p>
        <h1>Top 30 Hackers</h1>
        <ol>{ stats }</ol>
      </div>
    )
  }
}
