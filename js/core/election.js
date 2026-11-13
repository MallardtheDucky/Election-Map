export function evaluate(record) {
  const gop = record.votesGop;
  const dem = record.votesDem;
  const ind = record.votesInd;
  const total = gop + dem + ind;
  const hasData = record.electoralVotes > 0 || total > 0;

  let leader = 'Tossup';
  let margin = 0;
  if (total > 0) {
    const ranked = [
      ['GOP', gop],
      ['DEM', dem],
      ['IND', ind]
    ].sort((a, b) => b[1] - a[1]);
    margin = (ranked[0][1] - ranked[1][1]) / total;
    if (ranked[0][1] > ranked[1][1]) {
      leader = ranked[0][0];
    }
  }
  const declared = record.called === null ? record.reporting >= 100 : record.called;
  const called = declared && leader !== 'Tossup';

  let status = hasData ? 'Uncalled' : 'No Data';
  if (total > 0) {
    if (leader === 'Tossup') {
      status = 'Tossup';
    } else if (called || margin >= 0.1) {
      status = `Solid ${leader}`;
    } else if (margin >= 0.05) {
      status = `Likely ${leader}`;
    } else if (margin >= 0.02) {
      status = `Lean ${leader}`;
    } else {
      status = `Tilt ${leader}`;
    }
  }

  return { ...record, total, hasData, leader, margin, status, called };
}

export function summarize(states) {
  const summary = {
    gopEV: 0,
    demEV: 0,
    indEV: 0,
    gopPV: 0,
    demPV: 0,
    totalPV: 0,
    totalExpected: 0,
    indPV: 0,
    gopCandidate: '',
    demCandidate: '',
    indCandidate: ''
  };

  states.forEach(state => {
    summary.gopPV += state.votesGop;
    summary.demPV += state.votesDem;
    summary.indPV += state.votesInd;
    summary.totalPV += state.total;
    if (state.reporting > 0) {
      summary.totalExpected += state.total / (state.reporting / 100);
    }
    if (state.called) {
      if (state.leader === 'GOP') {
        summary.gopEV += state.electoralVotes;
      } else if (state.leader === 'DEM') {
        summary.demEV += state.electoralVotes;
      } else {
        summary.indEV += state.electoralVotes;
      }
    }
    if (!summary.gopCandidate && state.gopCandidate) {
      summary.gopCandidate = state.gopCandidate;
    }
    if (!summary.demCandidate && state.demCandidate) {
      summary.demCandidate = state.demCandidate;
    }
    if (!summary.indCandidate && state.indCandidate) {
      summary.indCandidate = state.indCandidate;
    }
  });

  return summary;
}
