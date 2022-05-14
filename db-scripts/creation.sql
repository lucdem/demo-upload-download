CREATE TABLE public.file (
    id integer NOT NULL,
    name varchar NOT NULL,
    path varchar not NULL,
	ip varchar NOT NULL,
	size integer NOT NULL
);

ALTER TABLE public.file OWNER TO postgres;

ALTER TABLE public.file ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.file_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE ONLY public.file
    ADD CONSTRAINT file_pkey PRIMARY KEY (id);

REVOKE CONNECT,TEMPORARY ON DATABASE football_website FROM PUBLIC;
GRANT CONNECT ON DATABASE football_website TO api;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.file TO api;