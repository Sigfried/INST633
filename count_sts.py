
import csv
import collections

src_tgt = collections.defaultdict(dict)
tgt_src = collections.defaultdict(dict)
both = collections.defaultdict(dict)

with open('roseanne_edges_07-06.csv', 'r') as f:
    reader = csv.reader(f)
    for row in reader:
        src = row[0]
        tgt = row[1]
        if src == tgt:
            continue
        src_tgt[src][tgt] = True
        tgt_src[tgt][src] = True
        if src_tgt[tgt].get(src):
            both[src + ',' + tgt] = True
        if tgt_src[src].get(tgt):
            both[src + ',' + tgt] = True

print("Source,Target")
for st in both.keys():
    print(st)
