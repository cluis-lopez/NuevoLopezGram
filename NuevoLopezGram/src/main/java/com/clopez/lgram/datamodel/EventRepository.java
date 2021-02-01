package com.clopez.lgram.datamodel;

import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cloud.gcp.data.datastore.repository.DatastoreRepository;
import org.springframework.cloud.gcp.data.datastore.repository.query.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends DatastoreRepository<Event, String>{

	@Query("SELECT * FROM event WHERE isComment = false ORDER BY createdAt DESC LIMIT @number OFFSET @offset")
	List<Event> getLastParentEvents(@Param ("number") int number, @Param ("offset") int offset);
	
	@Query("SELECT comments FROM event WHERE __key__ = KEY(event, @eventId)")
	List<String> getCommentsFromId(@Param ("eventId") String eventId);
	@Query("SELECT * FROM event WHERE creatorMail = @email")
	List<Event> getEventsFromUserEmail(@Param ("email") String email);
}
