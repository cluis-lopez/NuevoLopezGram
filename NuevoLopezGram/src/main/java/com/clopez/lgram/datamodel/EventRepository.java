package com.clopez.lgram.datamodel;

import java.util.List;

import org.springframework.cloud.gcp.data.datastore.repository.DatastoreRepository;
import org.springframework.cloud.gcp.data.datastore.repository.query.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends DatastoreRepository<Event, String>{

	@Query("SELECT * FROM event ORDER BY createdAt DESC LIMIT @number")
	List<Event> getLastEvents(@Param ("number") int number);
}
