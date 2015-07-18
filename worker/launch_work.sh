CLASSNAME=$1

stop-dfs.sh
stop-yarn.sh
rm -r /vol-01/hadoop
hdfs namenode -format -force
start-dfs.sh
start-yarn.sh
rm -r /result/output
hadoop fs -mkdir /input
hadoop fs -put /datasets/dataset /input/
hadoop jar /jobs/job $CLASSNAME /input/dataset /output/
hadoop fs -get /output /result      
stop-dfs.sh
stop-yarn.sh
