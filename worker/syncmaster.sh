SLAVE=$1
MASTER=$2
ssh root@"$SLAVE" "
rm ~/hadoop-2.6.0/etc/hadoop/masters
sed '/master/d' /etc/hosts > temp
echo '$MASTER' " master" >> temp
cp temp /etc/hosts
echo $SLAVE 'euca-'`echo $SLAVE | sed 's/\./-/g'`'.eucalyptus.internal'
stop-dfs.sh
stop-yarn.sh
rm -r /vol-01/hadoop
hdfs namenode -format -force
start-dfs.sh
echo '
 <configuration>
  <property>
    <name>yarn.nodemanager.aux-services</name>
    <value>mapreduce_shuffle</value>
  </property>
  <property>
    <name>yarn.nodemanager.aux-services.mapreduce.shuffle.class</name>
    <value>org.apache.hadoop.mapred.ShuffleHandler</value>
  </property>
  <property>
    <name>yarn.resourcemanager.resource-tracker.address</name>
    <value>master:8025</value>
  </property>
  <property>
    <name>yarn.resourcemanager.scheduler.address</name>
    <value>master:8030</value>
  </property>
  <property>
    <name>yarn.resourcemanager.address</name>
    <value>master:8040</value>
  </property>
 </configuration>
' > /root/hadoop-2.6.0/etc/hadoop/yarn-site.xml

echo '
<configuration>
<property>
  <name>mapred.job.tracker</name>
  <value>master:54311</value>
  <description>The host and port that the MapReduce job tracker runs
  at.  If local, then jobs are run in-process as a single map
  and reduce task.
  </description>
</property>
  <name>mapreduce.framework.name</name>
  <value>yarn</value>
</property>
</configuration>
' > /root/hadoop-2.6.0/etc/hadoop/mapred-site.xml
echo '
<configuration>
<property>
  <name>fs.default.name</name>
  <value>hdfs://master:54310</value>
</property>
<property>
<name>hadoop.tmp.dir</name>
<value>/vol-01/hadoop/hdfs</value>
</property>
</configuration>
' > /root/hadoop-2.6.0/etc/hadoop/core-site.xml

" >> /etc/hosts
