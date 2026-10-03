import java.util.*;

public class Dijkstra {

    static final int V = 5;

    int minDistance(int dist[], boolean sptSet[]) {

        int min = Integer.MAX_VALUE;
        int minIndex = -1;

        for (int v = 0; v < V; v++) {
            if (!sptSet[v] &&
                    dist[v] <= min) {
                min = dist[v];
                minIndex = v;
            }
        }
        return minIndex;
    }

    void dijkstra(int graph[][], int src) {

        int dist[] = new int[V];
        boolean sptSet[] = new boolean[V];

        Arrays.fill(dist, Integer.MAX_VALUE);

        dist[src] = 0;

        for (int count = 0; count < V - 1; count++) {

            int u = minDistance(dist, sptSet);

            sptSet[u] = true;

            for (int v = 0; v < V; v++) {

                if (!sptSet[v] &&
                        graph[u][v] != 0 &&
                        dist[u] != Integer.MAX_VALUE &&
                        dist[u] + graph[u][v] < dist[v])

                    dist[v] = dist[u] + graph[u][v];
            }
        }

        for (int i = 0; i < V; i++)
            System.out.println(
                    "Destination " + i +
                            " Distance = " + dist[i]);
    }

    public static void main(String[] args) {

        int graph[][] = {
                {0,10,0,30,100},
                {10,0,50,0,0},
                {0,50,0,20,10},
                {30,0,20,0,60},
                {100,0,10,60,0}
        };

        new Dijkstra().dijkstra(graph,0);
    }
}