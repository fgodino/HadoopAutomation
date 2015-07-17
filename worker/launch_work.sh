stop-dfs.sh
stop-yarn.sh
hdfs namenode -format -force
start-dfs.sh
start-yarn.sh
hadoop fs -rm /input/dataset
hadoop fs -rmr /input
hadoop fs -rmr /output
hadoop fs -mkdir /input
hadoop fs -mkdir /output
hadoop fs -put /datasets/dataset /input/
hadoop jar /jobs/job WordCount /input/dataset /output/job
hadoop fs -get /output /jobs/result      
stop-dfs.sh
stop-yarn.sh
