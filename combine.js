'use strict'
const dsv = require('d3-dsv')
const os = require("os")
var fs = require('fs')
const neatCsv = require('neat-csv')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const _ = require('supergroup')
const should = require('should')

class Node {
  constructor(id) {
    if (Nodes[id]) {
      let node = Nodes[id]
      return node
    }
    this.id = id
    this.netwk = {
      sources: [],
      targets: [],
    }
    this.tweets = []
    this.mentions = []
    Nodes[id] = this
  }
  addTarget(id) {
    this.netwk.targets.push(id)
  }
  addSource(id) {
    this.netwk.sources.push(id)
  }
  addTweet(t) {
    this.tweets.push(t)
  }
  addMention(t) {
    this.mentions.push(t)
  }
  static vals() {
    return _.values(Nodes)
  }
  gephiNode() {
    let rec = {
      ID: this.id,
      tweets: this.tweets.length,
      mentions: this.mentions.length,
      pro: this.tweets.length
            ? _.mean(this.tweets.map(tweet=>this.tweetScores(tweet).pro))
            : '',
    }
    let group
    if (rec.pro === '') {
      group = ''
    } else if (rec.pro < 3) {
      group = 'anti'
    } else if (rec.pro > 3) {
      group = 'pro'
    } else if (rec.pro === 3) {
      group = 'unclear/neutral'
    } else {
      throw new Error('weird')
    }
    rec.group = group
    return rec
    /*
    CODES.forEach(code => {
      this['raw-' + code] = [ this.tweets.map(t=>(t.code1 === code)+0),
                             this.tweets.map(t=>(t.code2 === code)+0) ]
      this[code] = 
        _.range(rec.tweets)
          .map(i => (this[`raw-${code}`][0][i] & this[`raw-${code}`][1][i]))
    })
    let denominator = rec.tweets + 0.0
    rec.pro = (_.sum(this['Pro-Roseanne']) / denominator) || ''
    rec.anti = (_.sum(this['Anti-Roseanne']) / denominator) || ''
    rec.neutral = (_.sum(this['Neutral']) / denominator) || ''
    return rec
    */
  }
  tweetScores(t) {
    let score = {
      agree: 0,
      pro: null,
      unclear: 0
    }
    if (t.code1 === t.code2) {
      score.agree = 1
      switch (t.code1) {
        case 'Unclear/Unrelated':
          score.pro = 3
          score.unclear = 1
          break
        case 'Pro-Roseanne': 
          score.pro = 5
          break
        case 'Anti-Roseanne': 
          score.pro = 1
          break
        case 'Neutral': 
          score.pro = 3
          break
        default:
          throw new Error("didn't expect no code")
      }
    }
    return score
  }
  gephiEdges() {
    let targets = {}
    this.edges = _.flatten(
      this.tweets.map(
        tweet => {
          tweet.scores = this.tweetScores(tweet)
          tweet.edges = tweet.targets.map(
            tgt => {
              let edge = {
                Source: this.id,
                Target: tgt,
                Date: tweet.date,
                Weight: 1,
                pro: tweet.scores.pro,
                agree: tweet.scores.agree,
                unclear: tweet.scores.unclear,
              }
              return edge
            }
          )
          return tweet.edges
        }
      )
    )
    return this.edges
  }
}
const edgef = './Q2-edges.csv'
const codingaf = './Copy of Roseanne Coding - A-J.tsv'
const codingbf = './Copy of Roseanne Coding - K-Z.tsv'

const edges = dsv.tsvParse(fs.readFileSync(edgef, 'utf8'))
const codinga = dsv.tsvParse(fs.readFileSync(codingaf, 'utf8'))
const codingb = dsv.tsvParse(fs.readFileSync(codingbf, 'utf8'))


let Nodes = {}
let usersMissingFromEdges = {}
let targetsMissingFromEdges = {}
let notMissing = 0

const CODES = [
      'Pro-Roseanne',
      'Anti-Roseanne',
      'Neutral',
      'Unclear/Unrelated',
]

processData({edges, codinga, codingb})

// output nodes
let gephiNodes = _.values(Nodes).map(node => node.gephiNode())
//console.log(gephiNodes.filter(n=>n.tweets > 1))
//gephiNodes.filter(n=>n.tweets > 1).map(d=>JSON.stringify(d,null,0)).forEach(d=>console.log(d,'\n'))
writeNodes(gephiNodes)

/*
_.filter(Nodes, (n,id)=>n.tweets.length > 1)
  .map((n,id) => console.log(
                    `${n.id}, ${n.tweets.length} tweets, targets: `,
                    JSON.stringify(n.tweets.map(t=>t.targets)), '\n'))
*/
writeEdges(_.flatten(_.values(Nodes).map(n=>n.gephiEdges())))

function writeNodes(nodes) {
  //console.log('weird?', JSON.stringify(nodes[0]))
  const csvWriter = createCsvWriter({
    path: './coded-only/coded-only-nodes.csv',
    header: [
      {id: 'ID', title: 'ID'},
      {id: 'tweets', title: 'tweets'},
      {id: 'mentions', title: 'mentions'},
      {id: 'pro', title: 'pro'},
      {id: 'group', title: 'group'},
      //{id: 'anti', title: 'anti'},
      //{id: 'neutral', title: 'neutral'},
    ],
  });

  nodes = _.sortBy(nodes, n=>-n.pro)
  csvWriter.writeRecords(nodes)       // returns a promise
      .then(() => {
          console.log('...Done writing');
      });
}
function writeEdges(edges) {
  //console.log('weird?', JSON.stringify(edges[0]))
  const csvWriter = createCsvWriter({
    path: './coded-only/coded-only-edges.csv',
    header: [
      {id: 'Source', title: 'Source'},
      {id: 'Target', title: 'Target'},
      {id: 'Date', title: 'Date'},
      {id: 'agree', title: 'agree'},
      {id: 'unclear', title: 'unclear'},
      {id: 'pro', title: 'pro'},
      {id: 'Weight', title: 'Weight'},
    ],
  });

  csvWriter.writeRecords(edges)       // returns a promise
      .then(() => {
          console.log('...Done writing');
      });
}

function processData({edges, codinga, codingb}) {

  //  SKIPPING NETWORK EDGES FOR NOW
  if (false) {    // skip netw stuff for now
    _.each(edges, edge => {
      let src = new Node(edge.Source)
      src.addTarget(edge.Target)
      let tgt = new Node(edge.Target)
      tgt.addSource(edge.Source)
    })
    //console.log({ Nodes, Nodeslen: _.values(Nodes).length})
    //logstr(Node.vals().slice(200, 250), 2000)
    //logstr(Nodes, 5000)
  }

  const combined_coded_tweets = _.map(codinga, (rec, i) => {
    let {'Assigned To':coder1, Code: code1,
          Date:date, User:user, Tweet:tweet} = rec
    let {'Assigned To':coder2, Code:code2} = codingb[i]
    if (code1 === "") code1 = code2  // make missing codes agree
    if (code2 === "") code2 = code1
    user = '@' + user
    //let targets = tweet.split(/ /).filter(d=>d[0] === '@')
    //console.log(`[${tweet}]`)
    let splitb = tweet.split(/\b/)
    let targets = 
      splitb
        .filter((tok, i) => (splitb[i-1]||'').match(/@$/))
        .map(tok => '@' + tok)
    let t = {coder1, code1, coder2, code2, date, user, targets, tweet,}

    let node = new Node(user)
    node.addTweet(t)

    _.each(targets, target => {
      let tgt = new Node(target)
      tgt.addMention(t)
    })
    return t
  })
  //outNodes.write("wtf?\n\n")
  /*
  const out = [
    _.keys(combined_coded_tweets[0]) .join('\t'),
  ].concat( combined_coded_tweets.map(d => _.values(d).join('\t')))
  console.log(out.length, out.join('\n').substr(0,2000))

  fs.writeFileSync('./coded-only/combined-coded-tweets.tsv', out.join('\n'))
  */
  const csvWriter = createCsvWriter({
    path: './coded-only/combined-coded-tweets.tsv',
    header: [
      {id: 'coder1', title: 'coder1'},
      {id: 'code1', title: 'code1'},
      {id: 'coder2', title: 'coder2'},
      {id: 'code2', title: 'code2'},
      {id: 'date', title: 'date'},
      {id: 'user', title: 'user'},
      {id: 'targets', title: 'targets'},
      {id: 'tweet', title: 'tweet'},
    ],
  });
  csvWriter.writeRecords(combined_coded_tweets)       // returns a promise
      .then(() => {
        console.log('...Done writing');
        process.exit()
      });
    /*
      */
}


function checkData(things) {
  _.each(things,
    (v,k) => {
      try {
        console.log(`${k} ${typeof(v)} ${v.length}`)
        logstr(v)
      } catch(e) {
        console.error('error trying to process!')
      }
    }
  )
  let {edges, codinga, codingb} = things
  should(codinga.length).equal(codingb.length)
}

function logstr(o, len=100, indent=2) {
  let str = JSON.stringify(o, null, indent)
  console.log(str.slice(0, Math.min(len, str.length)))
}
  //checkData({edges, codinga, codingb})
  /*
  let tweets = addTweets(ppl, codinga, codingb)
  console.log({
    'ppl':_.values(ppl).length, 
    missingUsers: _.values(usersMissingFromEdges).length,
    missingTargets: _.values(targetsMissingFromEdges).length,
    notMissing,
  })
  let sg = _.supergroup(tweets,
    ['sourceInNetwork',
      d=>!!d.targetsInNetwork.true,
      d=>!!d.targetsInNetwork.true,
    ])
  //console.log(sg.summary())
  let tweetSources = _.uniq(tweets.map(t=>t.user))
  let tweetTargets = _.uniq(_.flatten(tweets.map(t=>t.targets)))
  console.log({
    tweetSources: tweetSources.length,
    tweetTargets: tweetTargets.length,
    union: _.union(tweetSources, tweetTargets).length,
    intersection: _.intersection(tweetSources, tweetTargets).length,
  })

  let netwSources = _.keys(ppl)
  let netwTargets = _.uniq(_.flatten(_.values(ppl).map(d=>d.targets)))
  console.log({
    netwSources: netwSources.length,
    netwTargets: netwTargets.length,
    union: _.union(netwSources, netwTargets).length,
    intersection: _.intersection(netwSources, netwTargets).length,
  })
  let unionSources = _.union(tweetSources, netwSources).length
  let unionTargets = _.union(tweetTargets, netwTargets).length
  let intersectionSources = _.intersection(tweetSources, netwSources).length
  let intersectionTargets = _.intersection(tweetTargets, netwTargets).length
  console.log({
    unionSources,
    intersectionSources,
    unionTargets,
    intersectionTargets,
    'pct tweet sources in netw': Math.round(1000 * intersectionSources / tweetSources.length) / 10,
    'pct tweet targets in netw': Math.round(1000 * intersectionTargets / tweetTargets.length) / 10,
    'pct netw sources in tweets': Math.round(1000 * intersectionSources / netwSources.length) / 10,
    'pct netw targets in tweets': Math.round(1000 * intersectionTargets / netwTargets.length) / 10,
  })
  //logstr(_.omit(ppl, ['@ChelseaClinton']), 2000)
  //logstr(ppl, 2000)
  console.log(ppl)
  logstr(tweets, 500)
  */
