#include <iostream>
#include <bits/stdc++.h>
using namespace std;

/*
    - Check for overflow
    - Add brackets while using bitwise
    - Check corner cases (out of bounds for loops)
    - Revise the code
    - Try to prove yourself wrong
*/

vector<int> minTime(int src, int dest, map<int, vector<pair<int, int>>> &mp)
{
    int n = mp.size();
    set<pair<int, int>> st; // time, node
    vector<int> time(n, 1e9);
    st.insert({0, src});
    time[src] = 0;
    while (st.size())
    {
        auto it = *st.begin();
        int tt = it.first;
        int node = it.second;

        st.erase(st.begin());

        for (auto it : mp[node])
        {
            int t = it.first;
            int AdjNode = it.second;
            if (tt + t < time[AdjNode])
            {
                if (time[AdjNode] != 1e9)
                    st.erase({time[AdjNode], AdjNode});

                time[AdjNode] = tt + t;
                st.insert({time[AdjNode], AdjNode});
            }
        }
    }
    return time;
}

void minNodesRemove(int src, int dest, map<int, vector<pair<int, int>>> &mp)
{
    
}

// bool canWeReach(int src, int dest, map<int, vector<pair<int, int>>> &mp)
// {
// }

int main()
{
    int n, m;
    cin >> n;
    map<int, vector<pair<int, int>>> mp;
    for (int i = 0; i < n; i++)
    {
        int temp;
        cin >> temp;
    }
    cin >> m;

    for (int i = 0; i < m; i++)
    {
        int u, v, t;
        cin >> u >> v >> t;
        mp[u].push_back({v, t});
        mp[v].push_back({u, t});
    }
    int src, dest;
    cin >> src >> dest;
    vector<int> minT = minTime(src, dest, mp);
    // is possible to reach
    if (minT[dest] != 1e9)
    {
        cout << 1 << endl;
    }
    else
        cout << 0 << endl;

    // min time to reach from src to destination
    if (minT[dest] != 1e9)
        cout << minT[dest] << endl;
    else
        cout << -1 << endl;

    // 
    minNodesRemove(src, dest, mp);

    return 0;
}